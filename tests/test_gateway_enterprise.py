from a2aconnect.enterprise import (
    ScimDirectory,
    SlaTracker,
    SsoAssertion,
    SsoSessionStore,
    VpcNetworkPolicy,
)
from a2aconnect.gateway import (
    AgentRegistry,
    EdgeRouter,
    HostedAuditRetention,
    HostedAuthStore,
    QuotaLedger,
    RetentionPolicy,
    TokenBucket,
)


def test_hosted_auth_and_tenant_registry():
    auth = HostedAuthStore()
    auth.issue(token="t1", tenant_id="acme", roles=["admin"])
    assert auth.authenticate("t1").ok
    assert not auth.authenticate("bad").ok
    assert auth.require_role("t1", "admin").ok
    assert not auth.require_role("t1", "owner").ok

    reg = AgentRegistry()
    reg.register(
        {"id": "a", "name": "A", "capabilities": [{"name": "x.y"}]},
        tenant_id="acme",
        endpoint="memory://a",
    )
    reg.register(
        {"id": "b", "name": "B", "capabilities": [{"name": "x.y"}]},
        tenant_id="other",
        endpoint="memory://b",
    )
    assert len(reg.list(tenant_id="acme")) == 1
    assert reg.find_by_capability("x.y", tenant_id="acme")[0].profile["id"] == "a"


def test_edge_routing_and_quotas():
    reg = AgentRegistry()
    reg.register({"id": "a", "name": "A", "capabilities": [{"name": "job"}]}, tenant_id="t")
    reg.register({"id": "b", "name": "B", "capabilities": [{"name": "job"}]}, tenant_id="t")
    router = EdgeRouter(reg)
    first = router.route(capability="job", tenant_id="t")
    second = router.route(capability="job", tenant_id="t")
    assert first.ok and second.ok
    assert {first.agent_id, second.agent_id} == {"a", "b"}

    quotas = QuotaLedger()
    quotas.set_limit("t", 1)
    assert quotas.allow("t").ok
    assert not quotas.allow("t").ok
    quotas.refill("t")
    assert quotas.allow("t").ok

    bucket = TokenBucket(rate_per_sec=100, capacity=1)
    assert bucket.allow()
    assert not bucket.allow()


def test_audit_retention():
    import time

    now = time.time()
    store = HostedAuditRetention(policy=RetentionPolicy(max_age_sec=3600, max_events=2))
    store.record({"type": "task.offer", "agent_id": "hub", "peer_id": "a", "ts_epoch": now - 2})
    store.record({"type": "task.result", "agent_id": "hub", "peer_id": "a", "ts_epoch": now - 1})
    store.record({"type": "event", "agent_id": "hub", "peer_id": "a", "ts_epoch": now})
    assert len(store.events) == 2
    assert store.query(event_type="event")[0]["type"] == "event"


def test_enterprise_sso_scim_vpc_sla():
    scim = ScimDirectory()
    scim.create_user(id="u1", user_name="ops", email="ops@ex.com")
    scim.create_group(id="g1", display_name="Admins")
    scim.add_member("g1", "u1")
    assert scim.get_user("u1").groups == ["g1"]

    sso = SsoSessionStore(ttl_sec=60)
    session = sso.login(
        SsoAssertion(subject="u1", email="ops@ex.com", tenant_id="acme", groups=["Admins"])
    )
    assert sso.validate(session.session_id) is not None
    sso.logout(session.session_id)
    assert sso.validate(session.session_id) is None

    vpc = VpcNetworkPolicy(allowed_hosts=["worker.internal"], allowed_prefixes=["10."])
    assert vpc.allow("https://worker.internal:8443/peer")
    assert vpc.allow("http://10.0.0.8/x")
    assert not vpc.allow("https://evil.example")

    sla = SlaTracker()
    sla.open(task_id="t1", name="job", sla_hours=1)
    rec = sla.complete("t1")
    assert rec is not None and not rec.breached
    ticket = sla.open_support_ticket(task_id="t1", severity="sev3", note="follow-up")
    assert ticket["id"].startswith("sup-")
