"""LF A2A bridge scaffold (roadmap).

Maps local interop profile concepts to LF A2A surfaces. The wire adapter that
speaks LF A2A on the network is not implemented yet — use these helpers for
documentation and future integration tests.
"""

from a2aconnect.bridge.mapping import LOCAL_TO_A2A, profile_to_agent_card_stub

__all__ = ["LOCAL_TO_A2A", "profile_to_agent_card_stub"]
