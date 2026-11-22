#!/usr/bin/env python3
"""Gateway preview: registry discovers a peer by capability, then handoff.

Run: python demos/registry_hub.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import AgentPeer, MemoryAuditLog, create_bus, from_async_fn  # noqa: E402
from a2aconnect.bridge import profile_to_agent_card_stub  # noqa: E402
from a2aconnect.gateway import AgentRegistry, StaticTokenGate, TokenBucket  # noqa: E402


async def summarize_run(input, ctx):
    text = (input or {}).get("text", "")
    await ctx.report_progress(percent=50, message="Summarizing")
    await asyncio.sleep(0.03)
    return {"summary": text[:120] + ("…" if len(text) > 120 else ""), "chars": len(text)}


async def main() -> None:
    gate = StaticTokenGate(token="dev-fleet-token")
    bucket = TokenBucket(rate_per_sec=5, capacity=5)
    registry = AgentRegistry()

    if not gate.allow("dev-fleet-token"):
        raise SystemExit("auth failed")
    if not bucket.allow():
        raise SystemExit("rate limited")

    bus = create_bus()
    audit = MemoryAuditLog()

    worker_profile = {
        "id": "summarizer",
        "name": "Summarizer",
        "capabilities": [{"name": "text.summarize", "version": "1"}],
    }
    registry.register(worker_profile, endpoint="memory://summarizer", meta={"tier": "oss"})

    worker = AgentPeer(
        profile=worker_profile,
        transport=bus.create_transport("summarizer"),
        handlers={"text.summarize": from_async_fn(summarize_run)},
    )
    hub = AgentPeer(
        profile={"id": "hub", "name": "Registry Hub", "capabilities": []},
        transport=bus.create_transport("hub"),
        audit=audit,
    )
    worker.start()
    hub.start()

    print("\n=== A2AConnect — registry hub (Gateway preview) ===\n")
    print("Agent Card stub:")
    print(json.dumps(profile_to_agent_card_stub(worker_profile), indent=2))

    matches = registry.find_by_capability("text.summarize")
    if not matches:
        raise SystemExit("no summarizer registered")
    target = matches[0].profile["id"]
    print(f"\nRegistry matched capability text.summarize → {target}")

    await hub.hello(target)
    outcome = await hub.offer_task(
        to=target,
        goal="Summarize fleet note",
        input={
            "text": (
                "A2AConnect connects mixed agent runtimes with handshake, capability "
                "negotiation, task handoff, policy, and audit — complementary to LF A2A and MCP."
            )
        },
        required_capabilities=["text.summarize"],
    )
    if outcome.get("status") != "completed":
        raise SystemExit(outcome)
    print("\nResult:")
    print(json.dumps(outcome["result"]["output"], indent=2))
    print("\n--- Audit ---")
    for event in audit.events:
        print(f"  {event.type:<22} peer={event.peer_id or '-'}")

    await asyncio.gather(hub.stop(), worker.stop())
    await bus.close()
    print("\n=== registry_hub ok ===\n")


if __name__ == "__main__":
    asyncio.run(main())
