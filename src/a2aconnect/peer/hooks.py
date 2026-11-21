from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

from a2aconnect.protocol.types import AgentId, AgentProfile

PolicyDecision = dict[str, Any]  # {"allow": True} | {"allow": False, "reason": str}


class PolicyHook(Protocol):
    async def before_offer(
        self, *, from_agent: AgentId, to: AgentId, offer: dict[str, Any]
    ) -> PolicyDecision: ...

    async def before_accept(
        self,
        *,
        from_agent: AgentId,
        to: AgentId,
        offer: dict[str, Any],
        local_profile: AgentProfile,
    ) -> PolicyDecision: ...


AuditEventType = Literal[
    "hello",
    "hello.ack",
    "capabilities.query",
    "capabilities.announce",
    "task.offer",
    "task.accept",
    "task.reject",
    "task.start",
    "task.progress",
    "task.result",
    "task.failed",
    "task.cancel",
    "event",
    "error",
    "policy.deny",
]


@dataclass
class AuditEvent:
    type: AuditEventType
    ts: str
    agent_id: AgentId
    peer_id: AgentId | None = None
    task_id: str | None = None
    detail: Any = None
    envelope: dict[str, Any] | None = None


class AuditHook(Protocol):
    def record(self, event: AuditEvent) -> None: ...


@dataclass
class MemoryAuditLog:
    events: list[AuditEvent] = field(default_factory=list)

    def record(self, event: AuditEvent) -> None:
        self.events.append(event)

    def clear(self) -> None:
        self.events.clear()
