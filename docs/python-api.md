# Python API reference

Public surface is re-exported from `a2aconnect` (see `src/a2aconnect/__init__.py`).

## Core types

### `AgentProfile`

```python
{
  "id": "researcher",          # required AgentId
  "name": "Researcher",        # required
  "capabilities": [            # required list
    {"name": "research.web", "version": "1", "description": "..."}
  ],
  "version": "0.1.0",          # optional
  "description": "...",        # optional
}
```

### `AgentPeer(...)`

| Arg | Type | Role |
|-----|------|------|
| `profile` | `AgentProfile` | Identity + capabilities |
| `transport` | `Transport` | How envelopes are sent/received |
| `handlers` | `dict[str, TaskHandler]` | Capability name → handler |
| `default_handler` | `TaskHandler \| None` | Fallback when no cap matches |
| `policy` | policy object \| None | `before_offer` / `before_accept` |
| `audit` | `MemoryAuditLog` \| hook \| None | Lifecycle recording |
| `on_message` | callable \| None | Debug/observe inbound envelopes |
| `default_task_timeout_ms` | float \| None | Default offer timeout |

`TaskHandler` signature: `async def handler(ctx: TaskContext) -> Any`.

Prefer wrapping `(input, ctx)` brains with `from_async_fn`.

### Lifecycle

```python
peer.start()                 # subscribe transport
await peer.hello("other")    # discovery
outcome = await peer.offer_task(...)
await peer.stop()
```

### `offer_task(...)` → outcome dict

| Param | Meaning |
|-------|---------|
| `to` | Peer agent id |
| `goal` | Human-readable goal string |
| `input` | JSON-serializable task input |
| `required_capabilities` | Cap names the assignee must advertise |
| `timeout_ms` | Wait budget for accept→result |
| `meta` | Optional metadata on the offer |
| `task_id` | Optional stable id (retries mint new ids) |
| `retries` | Extra attempts on retryable failure |

**Success**

```python
{"status": "completed", "result": {"taskId": "...", "output": <handler return>}}
```

**Failure**

```python
{"status": "failed", "error": {"taskId": "...", "code": "TIMEOUT|...", "message": "..."}}
```

### `TaskContext` (inside handlers)

| Method / field | Role |
|----------------|------|
| `ctx.offer` | Offer payload (`goal`, `input`, …) |
| `await ctx.report_progress(percent=…, message=…)` | `task.progress` |
| `await ctx.emit_event(name=…, data=…)` | `event` envelope |
| return value | Becomes `task.result` output |

### Discovery helpers

```python
from a2aconnect import has_all_capabilities, missing_capabilities

has_all_capabilities(profile["capabilities"], ["research.web"])
missing_capabilities(profile["capabilities"], ["write.brief"])
```

```python
caps = await peer.query_capabilities("researcher")
```

### Errors

`A2AError(code, message, *, retryable=False, task_id=None)`

Codes: `PROTOCOL_VERSION`, `UNKNOWN_TYPE`, `CAPABILITY_MISMATCH`, `TASK_NOT_FOUND`, `TIMEOUT`, `REJECTED`, `INTERNAL`, `INVALID_PAYLOAD`.

### Protocol helpers

```python
from a2aconnect import PROTOCOL_VERSION, create_envelope, create_id
```

## Related

- [Adapters](./adapters.md)
- [Transports](./transports.md)
- [Policy & audit](./policy-audit.md)
