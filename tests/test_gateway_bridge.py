from a2aconnect.bridge import LOCAL_TO_A2A, profile_to_agent_card_stub
from a2aconnect.gateway import AgentRegistry, StaticTokenGate, TokenBucket


def test_registry_find_by_capability():
    reg = AgentRegistry()
    reg.register(
        {"id": "a", "name": "A", "capabilities": [{"name": "x.y"}]},
        endpoint="memory://a",
    )
    assert reg.find_by_capability("x.y")[0].profile["id"] == "a"
    assert reg.find_by_capability("missing") == []


def test_token_gate_and_bucket():
    gate = StaticTokenGate(token="secret")
    assert gate.allow("secret")
    assert not gate.allow("nope")
    bucket = TokenBucket(rate_per_sec=100, capacity=2)
    assert bucket.allow()
    assert bucket.allow()
    assert not bucket.allow()


def test_agent_card_stub():
    card = profile_to_agent_card_stub(
        {
            "id": "researcher",
            "name": "Researcher",
            "capabilities": [{"name": "research.web", "description": "research"}],
        }
    )
    assert card["a2aconnect"]["agentId"] == "researcher"
    assert card["skills"][0]["id"] == "research.web"
    assert "Agent Card" in LOCAL_TO_A2A.values()
