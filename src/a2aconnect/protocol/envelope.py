from __future__ import annotations

from typing import Any

from a2aconnect.protocol.ids import create_id, now_iso
from a2aconnect.protocol.types import PROTOCOL_VERSION, AgentId, MessageType


def create_envelope(
    *,
    type: MessageType,
    from_agent: AgentId,
    to: AgentId | str,
    payload: Any,
    correlation_id: str | None = None,
    session_id: str | None = None,
    id: str | None = None,
) -> dict[str, Any]:
    """Build a wire envelope. Uses JSON key `from` (not from_)."""
    envelope: dict[str, Any] = {
        "v": PROTOCOL_VERSION,
        "id": id or create_id("msg"),
        "type": type,
        "from": from_agent,
        "to": to,
        "ts": now_iso(),
        "payload": payload,
    }
    if correlation_id is not None:
        envelope["correlationId"] = correlation_id
    if session_id is not None:
        envelope["sessionId"] = session_id
    return envelope


def is_envelope(value: Any) -> bool:
    if not isinstance(value, dict):
        return False
    return (
        value.get("v") == PROTOCOL_VERSION
        and isinstance(value.get("id"), str)
        and isinstance(value.get("type"), str)
        and isinstance(value.get("from"), str)
        and (isinstance(value.get("to"), str) or value.get("to") == "*")
        and isinstance(value.get("ts"), str)
        and "payload" in value
    )
