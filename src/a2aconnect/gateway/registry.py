from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from a2aconnect.protocol.types import AgentId, AgentProfile


@dataclass
class RegisteredAgent:
    profile: AgentProfile
    endpoint: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


class AgentRegistry:
    """In-process multi-agent registry (Gateway preview)."""

    def __init__(self) -> None:
        self._agents: dict[AgentId, RegisteredAgent] = {}

    def register(self, profile: AgentProfile, *, endpoint: str | None = None, meta: dict[str, Any] | None = None) -> RegisteredAgent:
        entry = RegisteredAgent(profile=profile, endpoint=endpoint, meta=meta or {})
        self._agents[profile["id"]] = entry
        return entry

    def unregister(self, agent_id: AgentId) -> None:
        self._agents.pop(agent_id, None)

    def get(self, agent_id: AgentId) -> RegisteredAgent | None:
        return self._agents.get(agent_id)

    def list(self) -> list[RegisteredAgent]:
        return list(self._agents.values())

    def find_by_capability(self, name: str) -> list[RegisteredAgent]:
        out: list[RegisteredAgent] = []
        for entry in self._agents.values():
            for cap in entry.profile.get("capabilities") or []:
                if cap.get("name") == name:
                    out.append(entry)
                    break
        return out
