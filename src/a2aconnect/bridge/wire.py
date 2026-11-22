from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from a2aconnect.bridge.mapping import profile_to_agent_card_stub
from a2aconnect.protocol.types import AgentProfile

# Local message type → LF A2A–shaped object kind
_TYPE_MAP = {
    "hello": "agent/hello",
    "hello.ack": "agent/hello.ack",
    "capabilities.query": "agent/capabilities.query",
    "capabilities.announce": "agent/capabilities.announce",
    "task.offer": "tasks/send",
    "task.accept": "tasks/accept",
    "task.reject": "tasks/reject",
    "task.start": "tasks/status",
    "task.progress": "tasks/status",
    "task.result": "tasks/status",
    "task.failed": "tasks/status",
    "event": "tasks/event",
}


@dataclass
class LfA2AWireAdapter:
    """On-wire LF A2A bridge adapter (OSS preview).

    Translates A2AConnect envelopes ↔ LF A2A–shaped JSON documents so fleets
    can integrate with LF A2A peers without inventing a rival wire standard.
    """

    def to_a2a(self, envelope: dict[str, Any]) -> dict[str, Any]:
        msg_type = str(envelope.get("type") or "")
        kind = _TYPE_MAP.get(msg_type, f"a2aconnect/{msg_type or 'unknown'}")
        payload = envelope.get("payload") or {}
        status = None
        if msg_type == "task.start":
            status = "working"
        elif msg_type == "task.progress":
            status = "working"
        elif msg_type == "task.result":
            status = "completed"
        elif msg_type == "task.failed":
            status = "failed"
        elif msg_type == "task.offer":
            status = "submitted"
        elif msg_type == "task.accept":
            status = "accepted"
        elif msg_type == "task.reject":
            status = "rejected"

        doc: dict[str, Any] = {
            "jsonrpc": "2.0",
            "id": envelope.get("id"),
            "method": kind,
            "params": {
                "id": envelope.get("correlationId") or envelope.get("id"),
                "sessionId": envelope.get("sessionId"),
                "metadata": {
                    "a2aconnect": {
                        "v": envelope.get("v"),
                        "from": envelope.get("from"),
                        "to": envelope.get("to"),
                        "type": msg_type,
                        "ts": envelope.get("ts"),
                    }
                },
                "message": payload,
            },
        }
        if status is not None:
            doc["params"]["status"] = {"state": status}
        return doc

    def from_a2a(self, document: dict[str, Any]) -> dict[str, Any]:
        params = document.get("params") if isinstance(document.get("params"), dict) else {}
        meta = ((params.get("metadata") or {}).get("a2aconnect")) or {}
        method = str(document.get("method") or "")
        reverse = {v: k for k, v in _TYPE_MAP.items()}
        # Prefer reverse map; for tasks/status use state → local type
        local_type = reverse.get(method)
        state = ((params.get("status") or {}).get("state")) if isinstance(params.get("status"), dict) else None
        if method == "tasks/status" and state:
            local_type = {
                "working": "task.progress",
                "completed": "task.result",
                "failed": "task.failed",
                "submitted": "task.offer",
                "accepted": "task.accept",
                "rejected": "task.reject",
            }.get(str(state), local_type or "event")
        local_type = local_type or meta.get("type") or "event"

        return {
            "v": meta.get("v") or 1,
            "id": document.get("id") or params.get("id"),
            "type": local_type,
            "from": meta.get("from"),
            "to": meta.get("to"),
            "ts": meta.get("ts"),
            "sessionId": params.get("sessionId"),
            "correlationId": params.get("id"),
            "payload": params.get("message") if params.get("message") is not None else params,
        }

    def agent_card(self, profile: AgentProfile, *, url: str | None = None) -> dict[str, Any]:
        card = profile_to_agent_card_stub(profile)
        if url:
            card["url"] = url
        card["a2aconnect"]["status"] = "wire-adapter"
        return card
