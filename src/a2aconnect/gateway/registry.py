from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from a2aconnect.protocol.types import AgentId, AgentProfile


@dataclass
class RegisteredAgent:
    profile: AgentProfile
    endpoint: str | None = None
    tenant_id: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


class AgentRegistry:
    """In-process multi-agent registry (Gateway hosted-registry preview).

    Supports tenant-scoped listing so multi-team fleets can share one process
    while keeping discovery isolated by tenant.
    """

    def __init__(self) -> None:
        self._agents: dict[AgentId, RegisteredAgent] = {}

    def register(
        self,
        profile: AgentProfile,
        *,
        endpoint: str | None = None,
        tenant_id: str | None = None,
        meta: dict[str, Any] | None = None,
    ) -> RegisteredAgent:
        entry = RegisteredAgent(
            profile=profile,
            endpoint=endpoint,
            tenant_id=tenant_id,
            meta=meta or {},
        )
        self._agents[profile["id"]] = entry
        return entry

    def unregister(self, agent_id: AgentId) -> None:
        self._agents.pop(agent_id, None)

    def get(self, agent_id: AgentId) -> RegisteredAgent | None:
        return self._agents.get(agent_id)

    def list(self, *, tenant_id: str | None = None) -> list[RegisteredAgent]:
        entries = list(self._agents.values())
        if tenant_id is None:
            return entries
        return [e for e in entries if e.tenant_id == tenant_id]

    def find_by_capability(
        self,
        name: str,
        *,
        tenant_id: str | None = None,
    ) -> list[RegisteredAgent]:
        out: list[RegisteredAgent] = []
        for entry in self.list(tenant_id=tenant_id):
            for cap in entry.profile.get("capabilities") or []:
                if cap.get("name") == name:
                    out.append(entry)
                    break
        return out
