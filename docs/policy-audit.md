# Policy & audit

Governance sits on `AgentPeer`, not inside your brain code.

## Policy hooks

Implement async methods:

```python
class AllowlistPolicy:
    async def before_offer(self, *, from_agent, to, offer):
        if to in {"researcher", "writer"}:
            return {"allow": True}
        return {"allow": False, "reason": f"{to} not allowlisted"}

    async def before_accept(self, *, from_agent, to, offer, local_profile):
        return {"allow": True}
```

Attach:

```python
AgentPeer(..., policy=AllowlistPolicy())
```

Denied offers/accepts surface as reject/fail paths and can emit `policy.deny` audit events.

## Audit

```python
from a2aconnect import MemoryAuditLog

audit = MemoryAuditLog()
peer = AgentPeer(..., audit=audit)

# after a run
for event in audit.events:
    print(event.type, event.peer_id, event.task_id)
```

Recorded types include `hello`, `hello.ack`, `task.offer`, `task.accept`, `task.progress`, `event`, `task.result`, `task.failed`, `policy.deny`, and more (see `AuditEventType` in `peer/hooks.py`).

Custom sinks: implement `record(self, event: AuditEvent) -> None`.

## Why it matters

- **Policy** keeps fleets from calling untrusted peers.
- **Audit** gives multi-team operators a trail without reading LLM logs.

Demo: `demos/two_agents.py` (allowlist + `MemoryAuditLog`).
