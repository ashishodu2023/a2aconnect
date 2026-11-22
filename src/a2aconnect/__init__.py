"""A2AConnect — SDK-agnostic agent interop runtime.

Docs: https://a2aconnect.dev
Compatible with / complementary to LF A2A; complements MCP. Not a competing wire standard.
"""

from a2aconnect.adapters import create_crew_style_adapter, create_graph_style_adapter, from_async_fn
from a2aconnect.discovery import has_all_capabilities, missing_capabilities
from a2aconnect.peer import AgentPeer, MemoryAuditLog
from a2aconnect.protocol import PROTOCOL_VERSION, A2AError, create_envelope, create_id
from a2aconnect.transport import (
    HttpJsonTransport,
    InMemoryBus,
    create_bus,
    reset_http_json_stubs,
    with_outbound_buffer,
)
from a2aconnect.util.retry import with_retry

__all__ = [
    "PROTOCOL_VERSION",
    "A2AError",
    "AgentPeer",
    "MemoryAuditLog",
    "HttpJsonTransport",
    "InMemoryBus",
    "create_bus",
    "create_crew_style_adapter",
    "create_envelope",
    "create_graph_style_adapter",
    "create_id",
    "from_async_fn",
    "has_all_capabilities",
    "missing_capabilities",
    "reset_http_json_stubs",
    "with_outbound_buffer",
    "with_retry",
]

__version__ = "0.1.0"

# Gateway preview + LF A2A bridge scaffold
from a2aconnect.gateway import AgentRegistry, RegisteredAgent, StaticTokenGate, TokenBucket
from a2aconnect.bridge import LOCAL_TO_A2A, profile_to_agent_card_stub

__all__ += [
    "AgentRegistry",
    "RegisteredAgent",
    "StaticTokenGate",
    "TokenBucket",
    "LOCAL_TO_A2A",
    "profile_to_agent_card_stub",
]
