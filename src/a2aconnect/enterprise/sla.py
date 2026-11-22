from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SlaRecord:
    task_id: str
    name: str
    deadline_at: float
    completed_at: float | None = None
    breached: bool = False
    meta: dict[str, Any] = field(default_factory=dict)


class SlaTracker:
    """Track task SLAs and support escalations (Enterprise preview).

    Records deadlines, marks completion, and lists breaches for support queues.
    """

    def __init__(self) -> None:
        self._records: dict[str, SlaRecord] = {}
        self._support_tickets: list[dict[str, Any]] = []

    def open(
        self,
        *,
        task_id: str,
        name: str,
        sla_hours: float,
        meta: dict[str, Any] | None = None,
    ) -> SlaRecord:
        record = SlaRecord(
            task_id=task_id,
            name=name,
            deadline_at=time.time() + sla_hours * 3600,
            meta=dict(meta or {}),
        )
        self._records[task_id] = record
        return record

    def complete(self, task_id: str, *, now: float | None = None) -> SlaRecord | None:
        record = self._records.get(task_id)
        if record is None:
            return None
        now = time.time() if now is None else now
        record.completed_at = now
        record.breached = now > record.deadline_at
        return record

    def check_breaches(self, *, now: float | None = None) -> list[SlaRecord]:
        now = time.time() if now is None else now
        breached: list[SlaRecord] = []
        for record in self._records.values():
            if record.completed_at is None and now > record.deadline_at:
                record.breached = True
                breached.append(record)
            elif record.breached:
                breached.append(record)
        return breached

    def open_support_ticket(
        self,
        *,
        task_id: str,
        severity: str = "sev2",
        note: str = "",
    ) -> dict[str, Any]:
        ticket = {
            "id": f"sup-{len(self._support_tickets) + 1:04d}",
            "task_id": task_id,
            "severity": severity,
            "note": note,
            "opened_at": time.time(),
        }
        self._support_tickets.append(ticket)
        return ticket

    def support_queue(self) -> list[dict[str, Any]]:
        return list(self._support_tickets)
