# Getting started

## Requirements

- Python 3.11+
- (Optional) Node.js 20+ for the marketing site in `apps/web`

## Install the library

```bash
cd /path/to/a2aconnect
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
pytest
```

## Run an agent→agent demo (no API keys)

```bash
python demos/quickstart.py        # orchestrator → researcher
python demos/support_desk.py      # intake → billing → reply
python demos/incident_handoff.py  # commander → SRE
python demos/two_agents.py        # researcher → writer (cross-runtime)
```

Each demo prints JSON results and an audit trail, then exits `0`.

## Minimal code path

```python
import asyncio
from a2aconnect import AgentPeer, MemoryAuditLog, create_bus, from_async_fn

async def research_run(input, ctx):
    topic = (input or {}).get("topic", ctx.offer["goal"])
    await ctx.report_progress(percent=50, message=f"Researching {topic}")
    return {"topic": topic, "findings": [f"{topic}: use a shared handoff layer"]}

async def main():
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
    )
    print(outcome)
    await asyncio.gather(orchestrator.stop(), researcher.stop())
    await bus.close()

asyncio.run(main())
```

Full file: [`demos/quickstart.py`](../demos/quickstart.py).

## Frontend (optional)

```bash
cd apps/web
npm install
npm run dev   # http://127.0.0.1:4783
```

## Next steps

- [Architecture](./architecture.md) — how peers, transports, and standards fit
- [Python API](./python-api.md) — `offer_task`, handlers, hooks
- [Adapters](./adapters.md) — graph-style / crew-style wrappers
- [protocol/SPEC.md](../protocol/SPEC.md) — wire profile
