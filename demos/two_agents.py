#!/usr/bin/env python3
"""A2AConnect cross-runtime demo (Python).

Orchestrator (custom) → Researcher (graph-style) → Writer (crew-style).

Run: python demos/two_agents.py
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
    create_crew_style_adapter,
    create_graph_style_adapter,
    with_outbound_buffer,
)


def log(agent: str, message: str) -> None:
    print(f"[{agent}] {message}")


async def main() -> None:
    bus = create_bus()
    audit = MemoryAuditLog()

    async def research_run(input, ctx):
        topic = str((input or {}).get("topic") if isinstance(input, dict) else ctx.offer["goal"])
        log("researcher", f'graph-style invoke for "{topic}"')
        await ctx.report_progress(percent=25, message="Gathering sources")
        await ctx.emit_event(name="source.found", data={"title": f"{topic} overview"})
        await asyncio.sleep(0.04)
        await ctx.report_progress(percent=100, message="Done")
        return {
            "topic": topic,
            "bullets": [
                f"{topic}: enterprises need mixed-runtime handoff",
                "LF A2A owns the peer wire standard; A2AConnect ships adapters + DX",
                "Policy and audit hooks close the production gap",
            ],
            "runtime": "graph-style",
        }

    async def write_run(input, ctx):
        notes = input or {}
        topic = notes.get("topic", "topic")
        bullets = notes.get("bullets", [])
        log("writer", f'crew-style role drafting "{topic}" (from {notes.get("runtime", "peer")})')
        await ctx.report_progress(percent=50, message="Drafting")
        await asyncio.sleep(0.04)
        brief = "\n".join(
            [
                f"# Brief: {topic}",
                "",
                *[f"- {b}" for b in bullets],
                "",
                "_Generated via A2AConnect cross-runtime handoff (graph-style → crew-style)._",
            ]
        )
        await ctx.report_progress(percent=100, message="Brief ready")
        return {"brief": brief, "runtime": "crew-style"}

    research_adapter = create_graph_style_adapter(node_name="research", run=research_run)
    write_adapter = create_crew_style_adapter(role="brief-writer", run=write_run)

    class AllowlistPolicy:
        async def before_offer(self, *, from_agent, to, offer):
            if to in {"researcher", "writer"}:
                return {"allow": True}
            return {"allow": False, "reason": f"Peer {to} is not allowlisted"}

    researcher = AgentPeer(
        profile={
            "id": "researcher",
            "name": "Researcher",
            "version": "0.1.0",
            "description": "Graph-style runtime adapter",
            "capabilities": [{"name": "research.web", "version": "1"}],
        },
        transport=with_outbound_buffer(bus.create_transport("researcher")),
        handlers={"research.web": research_adapter.to_handler()},
        on_message=lambda m: log("researcher", f"← {m['type']} from {m['from']}")
        if str(m["type"]).startswith(("task.", "hello", "event"))
        else None,
    )

    writer = AgentPeer(
        profile={
            "id": "writer",
            "name": "Writer",
            "version": "0.1.0",
            "description": "Crew-style runtime adapter",
            "capabilities": [{"name": "write.brief", "version": "1"}],
        },
        transport=with_outbound_buffer(bus.create_transport("writer")),
        handlers={"write.brief": write_adapter.to_handler()},
        on_message=lambda m: log("writer", f"← {m['type']} from {m['from']}")
        if str(m["type"]).startswith(("task.", "hello"))
        else None,
    )

    orchestrator = AgentPeer(
        profile={
            "id": "orchestrator",
            "name": "Orchestrator",
            "version": "0.1.0",
            "description": "Custom Python orchestrator",
            "capabilities": [],
        },
        transport=bus.create_transport("orchestrator"),
        audit=audit,
        policy=AllowlistPolicy(),
        on_message=lambda m: log("orchestrator", f"← {m['type']} from {m['from']}")
        if m["type"]
        in {"hello.ack", "task.accept", "task.progress", "task.result", "event"}
        else None,
    )

    researcher.start()
    writer.start()
    orchestrator.start()

    print("\n=== A2AConnect — cross-runtime E2E demo (Python) ===\n")
    print("Runtimes: custom orchestrator → graph-style researcher → crew-style writer\n")

    await orchestrator.hello("researcher")
    await orchestrator.hello("writer")
    await asyncio.sleep(0.02)

    remotes = ", ".join(r.agent_id for r in orchestrator.list_remotes())
    log("orchestrator", f"Sessions: {remotes}")

    research = await orchestrator.offer_task(
        to="researcher",
        goal="Research agent interop",
        input={"topic": "agent interop runtimes"},
        required_capabilities=["research.web"],
        timeout_ms=10_000,
        retries=1,
    )
    if research.get("status") != "completed":
        print("Research failed:", research)
        raise SystemExit(1)

    log("orchestrator", "Research complete")
    print(json.dumps(research["result"]["output"], indent=2))

    write = await orchestrator.offer_task(
        to="writer",
        goal="Write a short brief from research notes",
        input=research["result"]["output"],
        required_capabilities=["write.brief"],
        timeout_ms=10_000,
    )
    if write.get("status") != "completed":
        print("Write failed:", write)
        raise SystemExit(1)

    log("orchestrator", "Brief complete\n")
    print(write["result"]["output"]["brief"])

    print("\n--- Audit trail ---")
    for event in audit.events:
        task = f" task={event.task_id[:12]}…" if event.task_id else ""
        print(f"  {event.type:<22} peer={event.peer_id or '-'}{task}")

    print("\n=== demo ok ===\n")

    await asyncio.gather(orchestrator.stop(), researcher.stop(), writer.stop())
    await bus.close()


if __name__ == "__main__":
    asyncio.run(main())
