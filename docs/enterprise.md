# Enterprise tier (OSS preview)

Enterprise adds identity, network isolation, and SLA/support controls. OSS previews are in-process; hosted IdP / VPC / support desk is the paid tier.

| Surface | APIs | Role |
|---------|------|------|
| SSO / SCIM | `SsoSessionStore`, `SsoAssertion`, `ScimDirectory` | Login sessions + user/group provisioning |
| VPC networking | `VpcNetworkPolicy` | Allowlist hosts/prefixes for peer endpoints |
| SLA & support | `SlaTracker`, `SlaRecord` | Deadlines, breaches, support tickets |

```python
from a2aconnect.enterprise import (
    ScimDirectory,
    SlaTracker,
    SsoAssertion,
    SsoSessionStore,
    VpcNetworkPolicy,
)

scim = ScimDirectory()
scim.create_user(id="u1", user_name="ops", email="ops@example.com")
sso = SsoSessionStore()
session = sso.login(SsoAssertion(subject="u1", email="ops@example.com", tenant_id="acme"))
vpc = VpcNetworkPolicy(allowed_hosts=["worker.internal"])
vpc.assert_allowed("memory://worker.internal")
sla = SlaTracker()
sla.open(task_id="t1", name="handoff", sla_hours=4)
```

Demo: `python demos/gateway_enterprise.py`
