# A2AConnect architecture

**Product & docs:** [https://a2aconnect.dev](https://a2aconnect.dev)  
**Package:** `a2aconnect` (Python) · **Site:** Next.js in `apps/web`

## How it fits together

```
Agent brains (Python / LangGraph-shaped / CrewAI-shaped / custom)
        │  RuntimeAdapter / from_async_fn
        ▼
AgentPeer  (+ policy / audit)  ◄── Transport ──►  AgentPeer
        │                 in-memory / buffered / HTTP JSON
        ▼
Local interop profile (typed JSON envelopes)
        │  conceptual map (bridge roadmap)
   ┌────┴────┐
LF A2A     MCP
(peers)   (tools)
```

A2AConnect is the **product / DX / governance** layer. It does not replace LF A2A or MCP.

## Layers

| Layer | Responsibility |
|-------|----------------|
| Brains | Your runtimes and prompts — stay swappable |
| Adapters | Map `run(input, ctx)` → `TaskHandler` |
| AgentPeer | Handshake, offer/accept, progress, result |
| Policy / audit | Allowlists and lifecycle trails |
| Transport | Move envelopes (bus, buffer, HTTP stub) |
| Profile | Message types and fields (`protocol/SPEC.md`) |

## Connection flows

1. **Discovery** — `hello` / `hello.ack`, then `capabilities.query` / `announce`
2. **Negotiation** — `task.offer` with `requiredCapabilities`; mismatch → `task.reject`
3. **Handoff** — accept → start → progress/events → result/failed
4. **Governance** — `before_offer` / `before_accept`; `MemoryAuditLog`

Detailed diagrams: [a2aconnect.dev/architecture](https://a2aconnect.dev/architecture).

## Runtime shape

| Piece | Implementation |
|-------|----------------|
| Library | Pure Python `asyncio`, no hard LLM SDK deps |
| Site | Next.js (`apps/web`) · FastAPI backup (`apps/web_python_fastapi`) |
| Tests | pytest + pytest-asyncio |
| Demos | `demos/*.py` — executable agent→agent paths |

## Package map

```
src/a2aconnect/
  peer/         AgentPeer, TaskContext, hooks
  adapters/     from_async_fn, graph/crew style
  transport/    bus, buffer, HTTP stub
  protocol/     envelope, types, errors
  discovery/    capability matching
  util/         retry helper
```

## Related docs

- [Getting started](./getting-started.md)
- [Python API](./python-api.md)
- [Transports](./transports.md)
- [Policy & audit](./policy-audit.md)
- [SPEC](../protocol/SPEC.md)
