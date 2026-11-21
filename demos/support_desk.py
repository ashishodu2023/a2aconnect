#!/usr/bin/env python3
"""Executable agent→agent example: support intake → billing specialist → reply.

Run from repo root:
  pip install -e ".[dev]"
  python demos/support_desk.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import AgentPeer, MemoryAuditLog, create_bus, from_async_fn  # noqa: E402


TICKET = {
    "id": "TCK-1842",
    "customer": "Northwind Logistics",
    "channel": "email",
    "subject": "Invoice charged twice for March seats",
    "body": (
        "We were billed twice for our March seat renewal. "
        "Invoice INV-9031 and INV-9031-DUP both show $4,200. Please refund the duplicate."
    ),
}


async def intake_run(input, ctx):
    ticket = input or {}
    await ctx.report_progress(percent=30, message="Classifying ticket")
    text = f"{ticket.get('subject', '')} {ticket.get('body', '')}".lower()
    if "invoice" in text or "refund" in text or "billed" in text:
        route = "billing.dispute"
        priority = "high"
    else:
        route = "general"
        priority = "normal"
    await ctx.emit_event(name="ticket.classified", data={"route": route, "priority": priority})
    await ctx.report_progress(percent=100, message="Routed")
    return {
        "ticket_id": ticket.get("id"),
        "customer": ticket.get("customer"),
        "route": route,
        "priority": priority,
        "summary": ticket.get("subject"),
        "excerpt": (ticket.get("body") or "")[:160],
    }


async def billing_run(input, ctx):
    case = input or {}
    await ctx.report_progress(percent=25, message="Looking up invoices")
    await asyncio.sleep(0.03)
    await ctx.emit_event(
        name="invoice.matched",
        data={"primary": "INV-9031", "duplicate": "INV-9031-DUP", "amount": 4200},
    )
    await ctx.report_progress(percent=70, message="Preparing refund")
    decision = {
        "ticket_id": case.get("ticket_id"),
        "customer": case.get("customer"),
        "action": "refund_duplicate",
        "refund_amount_usd": 4200,
        "invoice_to_void": "INV-9031-DUP",
        "reason": "Duplicate seat renewal charge confirmed",
        "sla_hours": 24 if case.get("priority") == "high" else 72,
    }
    await ctx.report_progress(percent=100, message="Decision ready")
    return decision


async def reply_run(input, ctx):
    decision = input or {}
    await ctx.report_progress(percent=50, message="Drafting customer reply")
    reply = "\n".join(
        [
            f"Hi {decision.get('customer', 'there')},",
            "",
            f"Thanks for flagging ticket {decision.get('ticket_id')}.",
            f"We confirmed a duplicate charge and will refund "
            f"${decision.get('refund_amount_usd')} by voiding {decision.get('invoice_to_void')}.",
            f"Expected completion within {decision.get('sla_hours')} hours.",
            "",
            "— Support via A2AConnect agent handoff",
        ]
    )
    await ctx.report_progress(percent=100, message="Reply ready")
    return {"reply": reply, "action": decision.get("action")}


async def main() -> None:
    bus = create_bus()
    audit = MemoryAuditLog()

    intake = AgentPeer(
        profile={
            "id": "intake",
            "name": "Intake Agent",
            "capabilities": [{"name": "support.classify", "version": "1"}],
        },
        transport=bus.create_transport("intake"),
        handlers={"support.classify": from_async_fn(intake_run)},
    )
    billing = AgentPeer(
        profile={
            "id": "billing",
            "name": "Billing Specialist",
            "capabilities": [{"name": "billing.dispute", "version": "1"}],
        },
        transport=bus.create_transport("billing"),
        handlers={"billing.dispute": from_async_fn(billing_run)},
    )
    reply_agent = AgentPeer(
        profile={
            "id": "reply",
            "name": "Reply Agent",
            "capabilities": [{"name": "support.reply", "version": "1"}],
        },
        transport=bus.create_transport("reply"),
        handlers={"support.reply": from_async_fn(reply_run)},
    )
    desk = AgentPeer(
        profile={"id": "desk", "name": "Support Desk", "capabilities": []},
        transport=bus.create_transport("desk"),
        audit=audit,
    )

    for peer in (intake, billing, reply_agent, desk):
        peer.start()

    print("\n=== A2AConnect — support desk (agent → agent) ===\n")
    print(f"Ticket: {TICKET['id']} — {TICKET['subject']}\n")

    await desk.hello("intake")
    await desk.hello("billing")
    await desk.hello("reply")

    classified = await desk.offer_task(
        to="intake",
        goal="Classify and route support ticket",
        input=TICKET,
        required_capabilities=["support.classify"],
        timeout_ms=10_000,
    )
    if classified.get("status") != "completed":
        raise SystemExit(f"intake failed: {classified}")
    print("1) Intake classified:")
    print(json.dumps(classified["result"]["output"], indent=2))

    dispute = await desk.offer_task(
        to="billing",
        goal="Resolve billing dispute from classified ticket",
        input=classified["result"]["output"],
        required_capabilities=["billing.dispute"],
        timeout_ms=10_000,
    )
    if dispute.get("status") != "completed":
        raise SystemExit(f"billing failed: {dispute}")
    print("\n2) Billing decision:")
    print(json.dumps(dispute["result"]["output"], indent=2))

    reply = await desk.offer_task(
        to="reply",
        goal="Draft customer reply from billing decision",
        input=dispute["result"]["output"],
        required_capabilities=["support.reply"],
        timeout_ms=10_000,
    )
    if reply.get("status") != "completed":
        raise SystemExit(f"reply failed: {reply}")
    print("\n3) Customer reply:\n")
    print(reply["result"]["output"]["reply"])

    print("\n--- Audit (agent→agent) ---")
    for event in audit.events:
        print(f"  {event.type:<22} peer={event.peer_id or '-'}")

    await asyncio.gather(desk.stop(), intake.stop(), billing.stop(), reply_agent.stop())
    await bus.close()
    print("\n=== support_desk ok ===\n")


if __name__ == "__main__":
    asyncio.run(main())
