#!/usr/bin/env python3
"""Minimal A2AConnect quickstart — orchestrator hands research to a peer.

Run from repo root:
  pip install -e ".[dev]"
  python demos/quickstart.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import AgentPeer, MemoryAuditLog, create_bus  # noqa: E402
from a2aconnect.adapters import from_async_fn  # noqa: E402


async def research_run(input, ctx):
    topic = (input or {}).get("topic", ctx.offer["goal"])
    await ctx.report_progress(percent=40, message=f"Researching {topic}")
    await ctx.emit_event(name="source.found", data={"title": f"{topic} overview"})
    await asyncio.sleep(0.05)
    await ctx.report_progress(percent=100, message="Done")
    return {
        "topic": topic,
        "findings": [
            f"{topic}: mixed-runtime fleets need a shared handoff layer",
            "LF A2A is the peer wire standard; A2AConnect is the interop runtime",
            "Policy and audit hooks make production fleets operable",
        ],
    }


async def main() -> None:
    bus = create_bus()
    audit = MemoryAuditLog()

    researcher = AgentPeer(
        profile={
            "id": "researcher",
            "name": "Researcher",
            "capabilities": [{"name": "research.web", "version": "1"}],
        },
        transport=bus.create_transport("researcher"),
        handlers={"research.web": from_async_fn(research_run)},
    )
    orchestrator = AgentPeer(
        profile={"id": "orchestrator", "name": "Orchestrator", "capabilities": []},
        transport=bus.create_transport("orchestrator"),
        audit=audit,
    )

    researcher.start()
    orchestrator.start()

    await orchestrator.hello("researcher")
    outcome = await orchestrator.offer_task(
        to="researcher",
        goal="Research agent interop",
        input={"topic": "agent interop runtimes"},
        required_capabilities=["research.web"],
        timeout_ms=10_000,
    )

    if outcome.get("status") != "completed":
        print("FAILED:", json.dumps(outcome, indent=2, default=str))
        raise SystemExit(1)

    print("Research result:")
    print(json.dumps(outcome["result"]["output"], indent=2))
    print("\nAudit trail:")
    for event in audit.events:
        print(f"  {event.type:<22} peer={event.peer_id or '-'}")

    await asyncio.gather(orchestrator.stop(), researcher.stop())
    await bus.close()
    print("\n=== quickstart ok ===")


if __name__ == "__main__":
    asyncio.run(main())
