from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from a2aconnect.gateway.registry import AgentRegistry, RegisteredAgent


@dataclass
class RouteDecision:
    ok: bool
    agent_id: str | None = None
    endpoint: str | None = None
    reason: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


class EdgeRouter:
    """Capability-aware edge router (Gateway preview).

    Picks a registered peer for a required capability within a tenant, with
    optional sticky preference and simple round-robin across matches.
    """

    def __init__(self, registry: AgentRegistry) -> None:
        self._registry = registry
        self._rr: dict[str, int] = {}

    def route(
        self,
        *,
        capability: str,
        tenant_id: str | None = None,
        prefer: str | None = None,
    ) -> RouteDecision:
        matches = self._registry.find_by_capability(capability, tenant_id=tenant_id)
        if not matches:
            return RouteDecision(ok=False, reason="no_capable_peer")

        if prefer:
            for entry in matches:
                if entry.profile["id"] == prefer:
                    return self._decision(entry, reason="preferred")

        key = f"{tenant_id or '*'}::{capability}"
        idx = self._rr.get(key, 0) % len(matches)
        self._rr[key] = idx + 1
        return self._decision(matches[idx], reason="round_robin")

    @staticmethod
    def _decision(entry: RegisteredAgent, *, reason: str) -> RouteDecision:
        return RouteDecision(
            ok=True,
            agent_id=entry.profile["id"],
            endpoint=entry.endpoint,
            reason=reason,
            meta=dict(entry.meta),
        )
