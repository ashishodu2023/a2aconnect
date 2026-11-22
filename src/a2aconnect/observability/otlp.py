from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any


def _trace_id() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex[:16]


def _span_id() -> str:
    return uuid.uuid4().hex[:16]


@dataclass
class SpanRecord:
    name: str
    trace_id: str
    span_id: str
    parent_span_id: str | None = None
    start_ns: int = 0
    end_ns: int | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    status: str = "UNSET"


@dataclass
class MemorySpanExporter:
    """In-memory OTLP-shaped span collector (OSS preview)."""

    spans: list[SpanRecord] = field(default_factory=list)

    def start_span(
        self,
        name: str,
        *,
        attributes: dict[str, Any] | None = None,
        parent: SpanRecord | None = None,
        trace_id: str | None = None,
    ) -> SpanRecord:
        span = SpanRecord(
            name=name,
            trace_id=trace_id or (parent.trace_id if parent else _trace_id()),
            span_id=_span_id(),
            parent_span_id=parent.span_id if parent else None,
            start_ns=time.time_ns(),
            attributes=dict(attributes or {}),
        )
        self.spans.append(span)
        return span

    def end_span(self, span: SpanRecord, *, status: str = "OK", attributes: dict[str, Any] | None = None) -> SpanRecord:
        span.end_ns = time.time_ns()
        span.status = status
        if attributes:
            span.attributes.update(attributes)
        return span

    def to_otlp_json(self) -> dict[str, Any]:
        return {
            "resourceSpans": [
                {
                    "resource": {
                        "attributes": [
                            {"key": "service.name", "value": {"stringValue": "a2aconnect"}},
                        ]
                    },
                    "scopeSpans": [
                        {
                            "scope": {"name": "a2aconnect.observability", "version": "0.1.0"},
                            "spans": [
                                {
                                    "traceId": s.trace_id,
                                    "spanId": s.span_id,
                                    "parentSpanId": s.parent_span_id or "",
                                    "name": s.name,
                                    "kind": 1,
                                    "startTimeUnixNano": str(s.start_ns),
                                    "endTimeUnixNano": str(s.end_ns or s.start_ns),
                                    "attributes": [
                                        {"key": k, "value": {"stringValue": str(v)}}
                                        for k, v in s.attributes.items()
                                    ],
                                    "status": {"code": 1 if s.status == "OK" else 2 if s.status == "ERROR" else 0},
                                }
                                for s in self.spans
                            ],
                        }
                    ],
                }
            ]
        }


@dataclass
class OtlpJsonExporter:
    """HTTP OTLP/JSON exporter (OSS preview).

    Posts collected spans to an OTLP HTTP endpoint. When endpoint is None,
    keeps payloads in ``sent`` for local inspection.
    """

    endpoint: str | None = None
    timeout_sec: float = 10.0
    sent: list[dict[str, Any]] = field(default_factory=list)

    def export(self, collector: MemorySpanExporter) -> dict[str, Any]:
        payload = collector.to_otlp_json()
        self.sent.append(payload)
        if not self.endpoint:
            return {"ok": True, "mode": "memory", "spans": len(collector.spans)}
        import urllib.request

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={
                "content-type": "application/json",
                "accept": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:  # noqa: S310
            status = getattr(resp, "status", 200)
            if status >= 400:
                raise RuntimeError(f"OTLP export failed: {status}")
        return {"ok": True, "mode": "http", "spans": len(collector.spans), "status": status}
