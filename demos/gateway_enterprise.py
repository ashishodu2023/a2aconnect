#!/usr/bin/env python3
"""Gateway + Enterprise preview: auth, route, quota, retention, SSO/SCIM, VPC, SLA.

Run: python demos/gateway_enterprise.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import AgentPeer, MemoryAuditLog, create_bus, from_async_fn  # noqa: E402
from a2aconnect.enterprise import (  # noqa: E402
    ScimDirectory,
    SlaTracker,
    SsoAssertion,
    SsoSessionStore,
    VpcNetworkPolicy,
)
from a2aconnect.gateway import (  # noqa: E402
    AgentRegistry,
    EdgeRouter,
    HostedAuditRetention,
    HostedAuthStore,
    QuotaLedger,
    RetentionPolicy,
    TokenBucket,
)


async def summarize_run(input, ctx):
    text = (input or {}).get("text", "")
    await ctx.report_progress(percent=50, message="Summarizing")
    await asyncio.sleep(0.02)
    return {"summary": text[:100] + ("…" if len(text) > 100 else ""), "chars": len(text)}


async def main() -> None:
    print("\n=== A2AConnect — Gateway + Enterprise preview ===\n")

    # --- Enterprise: SSO / SCIM ---
    scim = ScimDirectory()
    scim.create_user(id="u-1", user_name="ops", email="ops@example.com", groups=["fleet-admins"])
    scim.create_group(id="g-admins", display_name="Fleet Admins", members=["u-1"])
    sso = SsoSessionStore(ttl_sec=600)
    session = sso.login(
        SsoAssertion(
            subject="u-1",
            email="ops@example.com",
            tenant_id="tenant-acme",
            groups=["fleet-admins"],
        )
    )
    assert sso.validate(session.session_id) is not None
    print("1) SSO session minted for", session.assertion.email)

    # --- Enterprise: VPC networking ---
    vpc = VpcNetworkPolicy(
        allowed_hosts=["summarizer.internal"],
        allowed_prefixes=["10.8."],
    )
    vpc.assert_allowed("memory://summarizer.internal")
    print("2) VPC policy allows summarizer.internal")

    # --- Gateway: hosted auth & registry ---
    auth = HostedAuthStore()
    auth.issue(token="gw-acme-token", tenant_id="tenant-acme", roles=["agent", "admin"])
    gate = auth.authenticate("gw-acme-token")
    if not gate.ok:
        raise SystemExit(gate)
    print("3) Hosted auth ok — tenant", gate.tenant_id)

    registry = AgentRegistry()
    worker_profile = {
        "id": "summarizer",
        "name": "Summarizer",
        "capabilities": [{"name": "text.summarize", "version": "1"}],
    }
    registry.register(
        worker_profile,
        endpoint="memory://summarizer.internal",
        tenant_id="tenant-acme",
        meta={"tier": "gateway"},
    )

    # --- Gateway: edge routing & quotas ---
    router = EdgeRouter(registry)
    bucket = TokenBucket(rate_per_sec=10, capacity=10)
    quotas = QuotaLedger()
    quotas.set_limit("tenant-acme", 100)
    if not bucket.allow():
        raise SystemExit("rate limited")
    q = quotas.allow("tenant-acme")
    if not q.ok:
        raise SystemExit(q)
    decision = router.route(capability="text.summarize", tenant_id="tenant-acme")
    if not decision.ok:
        raise SystemExit(decision)
    print(f"4) Edge routed text.summarize → {decision.agent_id} (quota left {q.remaining})")

    # --- Gateway: hosted audit retention ---
    retention = HostedAuditRetention(policy=RetentionPolicy(max_age_sec=86400, max_events=1000))

    # --- Enterprise: SLA ---
    sla = SlaTracker()
    sla.open(task_id="task-1", name="Summarize fleet note", sla_hours=1)

    bus = create_bus()
    audit = MemoryAuditLog()
    worker = AgentPeer(
        profile=worker_profile,
        transport=bus.create_transport("summarizer"),
        handlers={"text.summarize": from_async_fn(summarize_run)},
    )
    hub = AgentPeer(
        profile={"id": "hub", "name": "Gateway Hub", "capabilities": []},
        transport=bus.create_transport("hub"),
        audit=audit,
    )
    worker.start()
    hub.start()

    await hub.hello(decision.agent_id)
    outcome = await hub.offer_task(
        to=decision.agent_id,
        goal="Summarize note",
        input={"text": "Gateway auth, routing, quotas, retention + Enterprise SSO/SCIM, VPC, SLA."},
        required_capabilities=["text.summarize"],
    )
    if outcome.get("status") != "completed":
        raise SystemExit(outcome)

    sla_rec = sla.complete("task-1")
    for event in audit.events:
        retention.record(event)

    print("5) Handoff result:")
    print(json.dumps(outcome["result"]["output"], indent=2))
    print(f"6) SLA met={not sla_rec.breached if sla_rec else None}; retained audits={len(retention.query())}")
    print(f"7) SCIM users={len(scim.list_users(active_only=True))}")

    await asyncio.gather(hub.stop(), worker.stop())
    await bus.close()
    print("\n=== gateway_enterprise ok ===\n")


if __name__ == "__main__":
    asyncio.run(main())
