from __future__ import annotations

from typing import Any

from a2aconnect.protocol.types import AgentProfile

LOCAL_TO_A2A: dict[str, str] = {
    "AgentProfile + capabilities": "Agent Card",
    "task.offer → task.result|failed": "Task lifecycle",
    "task.progress + event": "Streaming task updates",
    "hello / hello.ack": "Session / discovery handshake",
    "policy + audit": "Product governance (A2AConnect-only)",
}


def profile_to_agent_card_stub(profile: AgentProfile) -> dict[str, Any]:
    """Conceptual Agent Card shape for docs/tests — not an on-wire LF A2A payload."""
    return {
        "name": profile.get("name"),
        "description": profile.get("description") or "",
        "version": profile.get("version") or "0.1.0",
        "url": f"a2aconnect://{profile['id']}",
        "capabilities": {
            "streaming": True,
            "pushNotifications": False,
        },
        "skills": [
            {
                "id": cap["name"],
                "name": cap["name"],
                "description": cap.get("description") or "",
                "tags": ["a2aconnect"],
            }
            for cap in profile.get("capabilities") or []
        ],
        "a2aconnect": {
            "agentId": profile["id"],
            "map": LOCAL_TO_A2A,
            "status": "scaffold",
        },
    }
