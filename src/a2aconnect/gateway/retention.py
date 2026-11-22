from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from a2aconnect.peer.hooks import AuditEvent


@dataclass
class RetentionPolicy:
    """How long hosted audit events are kept."""

    max_age_sec: float = 7 * 24 * 3600
    max_events: int = 10_000


@dataclass
class HostedAuditRetention:
    """In-process hosted audit retention preview.

    Accepts AuditEvent objects (or plain dicts), drops expired rows, and enforces
    a max event count — the OSS stand-in for Gateway's retained audit store.
    """

    policy: RetentionPolicy = field(default_factory=RetentionPolicy)
    events: list[dict[str, Any]] = field(default_factory=list)

    def record(self, event: AuditEvent | dict[str, Any]) -> dict[str, Any]:
        if isinstance(event, AuditEvent):
            row = {
                "type": event.type,
                "agent_id": event.agent_id,
                "peer_id": event.peer_id,
                "task_id": event.task_id,
                "ts": event.ts or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "ts_epoch": time.time(),
                "detail": event.detail,
            }
        else:
            row = dict(event)
            row.setdefault("ts_epoch", time.time())
            row.setdefault("ts", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
        self.events.append(row)
        self.prune()
        return row

    def prune(self, *, now: float | None = None) -> int:
        now = time.time() if now is None else now
        before = len(self.events)
        cutoff = now - self.policy.max_age_sec
        self.events = [e for e in self.events if float(e.get("ts_epoch", now)) >= cutoff]
        if len(self.events) > self.policy.max_events:
            self.events = self.events[-self.policy.max_events :]
        return before - len(self.events)

    def query(
        self,
        *,
        peer_id: str | None = None,
        agent_id: str | None = None,
        event_type: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        rows = self.events
        if peer_id is not None:
            rows = [e for e in rows if e.get("peer_id") == peer_id]
        if agent_id is not None:
            rows = [e for e in rows if e.get("agent_id") == agent_id]
        if event_type is not None:
            rows = [e for e in rows if e.get("type") == event_type]
        return rows[-limit:]
