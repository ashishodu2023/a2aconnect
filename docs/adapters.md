# Adapters — wrap brains without SDK lock-in

A2AConnect never imports LangGraph, CrewAI, or OpenAI. Adapters turn your existing async functions into `TaskHandler`s.

## `from_async_fn`

```python
from a2aconnect import from_async_fn

async def my_brain(input, ctx):
    await ctx.report_progress(percent=10, message="start")
    return {"ok": True, "echo": input}

handler = from_async_fn(my_brain)
# handler(ctx) → calls my_brain(ctx.offer["input"], ctx)
```

Register on a peer:

```python
AgentPeer(
    profile={..., "capabilities": [{"name": "my.cap"}]},
    transport=...,
    handlers={"my.cap": handler},
)
```

## Graph-style (LangGraph-shaped)

```python
from a2aconnect import create_graph_style_adapter

adapter = create_graph_style_adapter(node_name="research", run=research_run)
handlers = {"research.web": adapter.to_handler()}
```

Emits `runtime.enter` / `runtime.exit` events around your `run(input, ctx)`.

## Crew-style (CrewAI-shaped)

```python
from a2aconnect import create_crew_style_adapter

adapter = create_crew_style_adapter(role="brief-writer", run=write_run)
handlers = {"write.brief": adapter.to_handler()}
```

## Pattern for real frameworks

1. Keep your framework code in `run(input, ctx)`.
2. Wrap with `from_async_fn` or a style adapter.
3. Map each public skill to a capability name string.
4. Let `AgentPeer` own handshake, offer/accept, progress, and result.

See `demos/two_agents.py` and `demos/incident_handoff.py`.
