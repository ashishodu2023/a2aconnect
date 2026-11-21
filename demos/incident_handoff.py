#!/usr/bin/env python3
"""Executable agent→agent example: incident commander → SRE investigator.

Run:
  python demos/incident_handoff.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import (  # noqa: E402
    AgentPeer,
    MemoryAuditLog,
    create_bus,
    create_graph_style_adapter,
    from_async_fn,
)


INCIDENT = {
    "id": "INC-2207",
    "service": "checkout-api",
    "severity": "p1",
    "symptom": "checkout 5xx spike to 18% in us-west-2",
    "started_at": "2026-11-21T22:10:00Z",
}


async def plan_run(input, ctx):
    incident = input or {}
    await ctx.report_progress(percent=40, message="Building investigation plan")
    plan = {
        "incident_id": incident.get("id"),
        "service": incident.get("service"),
        "checks": [
            "error_budget burn for checkout-api",
            "deploy markers in last 60m",
            "dependency health: payments-gateway",
        ],
        "hypothesis": "recent deploy or payments-gateway latency",
        "owner_capability": "sre.investigate",
    }
    await ctx.emit_event(name="incident.planned", data={"checks": len(plan["checks"])})
    await ctx.report_progress(percent=100, message="Plan ready")
    return plan


async def investigate_run(input, ctx):
    plan = input or {}
    findings = []
    for i, check in enumerate(plan.get("checks", []), start=1):
        await ctx.report_progress(percent=int(i / max(len(plan["checks"]), 1) * 80), message=check)
        await asyncio.sleep(0.02)
        if "deploy" in check:
            findings.append({"check": check, "result": "deploy d-9841 rolled out 22 minutes ago"})
        elif "payments" in check:
            findings.append({"check": check, "result": "payments-gateway p95 +240ms in us-west-2"})
        else:
            findings.append({"check": check, "result": "error budget burn 4.2× baseline"})
    await ctx.emit_event(name="incident.root_cause", data={"likely": "payments-gateway latency after deploy d-9841"})
    await ctx.report_progress(percent=100, message="Investigation complete")
    return {
        "incident_id": plan.get("incident_id"),
        "service": plan.get("service"),
        "findings": findings,
        "recommendation": "Rollback checkout-api d-9841 or shed traffic from payments-gateway us-west-2",
    }


async def main() -> None:
    bus = create_bus()
    audit = MemoryAuditLog()

    planner = AgentPeer(
        profile={
            "id": "commander",
            "name": "Incident Commander",
            "capabilities": [{"name": "incident.plan", "version": "1"}],
        },
        transport=bus.create_transport("commander"),
        handlers={"incident.plan": from_async_fn(plan_run)},
    )
    sre_adapter = create_graph_style_adapter(node_name="investigate", run=investigate_run)
    sre = AgentPeer(
        profile={
            "id": "sre",
            "name": "SRE Investigator",
            "capabilities": [{"name": "sre.investigate", "version": "1"}],
        },
        transport=bus.create_transport("sre"),
        handlers={"sre.investigate": sre_adapter.to_handler()},
    )
    ops = AgentPeer(
        profile={"id": "ops", "name": "Ops Orchestrator", "capabilities": []},
        transport=bus.create_transport("ops"),
        audit=audit,
    )

    planner.start()
    sre.start()
    ops.start()

    print("\n=== A2AConnect — incident handoff (agent → agent) ===\n")
    print(json.dumps(INCIDENT, indent=2), "\n")

    await ops.hello("commander")
    await ops.hello("sre")

    plan = await ops.offer_task(
        to="commander",
        goal="Plan investigation for P1 checkout incident",
        input=INCIDENT,
        required_capabilities=["incident.plan"],
    )
    if plan.get("status") != "completed":
        raise SystemExit(plan)
    print("1) Commander plan:")
    print(json.dumps(plan["result"]["output"], indent=2))

    probe = await ops.offer_task(
        to="sre",
        goal="Execute investigation plan",
        input=plan["result"]["output"],
        required_capabilities=["sre.investigate"],
    )
    if probe.get("status") != "completed":
        raise SystemExit(probe)
    print("\n2) SRE findings:")
    print(json.dumps(probe["result"]["output"], indent=2))

    print("\n--- Audit ---")
    for event in audit.events:
        print(f"  {event.type:<22} peer={event.peer_id or '-'}")

    await asyncio.gather(ops.stop(), planner.stop(), sre.stop())
    await bus.close()
    print("\n=== incident_handoff ok ===\n")


if __name__ == "__main__":
    asyncio.run(main())
