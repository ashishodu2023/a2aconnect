# Gateway tier (OSS preview)

Commercial Gateway is hosted. OSS ships **in-process** primitives that mirror the product surfaces:

| Surface | APIs | Role |
|---------|------|------|
| Hosted auth & registry | `HostedAuthStore`, `AgentRegistry`, `StaticTokenGate` | Multi-tenant tokens + capability discovery |
| Edge routing & quotas | `EdgeRouter`, `QuotaLedger`, `TokenBucket` | Route by capability; hard caps + rate limits |
| Hosted audit retention | `HostedAuditRetention`, `RetentionPolicy` | Retain / prune / query audit rows |

```python
from a2aconnect.gateway import (
    AgentRegistry,
    EdgeRouter,
    HostedAuthStore,
    HostedAuditRetention,
    QuotaLedger,
    TokenBucket,
)

auth = HostedAuthStore()
auth.issue(token="…", tenant_id="acme", roles=["agent"])
registry = AgentRegistry()
registry.register(profile, endpoint="memory://worker", tenant_id="acme")
router = EdgeRouter(registry)
decision = router.route(capability="text.summarize", tenant_id="acme")
```

Demos:

- `python demos/registry_hub.py` — registry + token + rate limit
- `python demos/gateway_enterprise.py` — full Gateway + Enterprise path

See also [enterprise.md](./enterprise.md) and [ROADMAP.md](../ROADMAP.md).
