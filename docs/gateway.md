# Gateway preview (OSS)

Commercial Gateway is roadmap. OSS ships **in-process** primitives so you can practice fleet governance locally:

| Primitive | Module | Role |
|-----------|--------|------|
| `AgentRegistry` | `a2aconnect.gateway` | Register peers; find by capability |
| `StaticTokenGate` | `a2aconnect.gateway` | Shared-secret allow/deny |
| `TokenBucket` | `a2aconnect.gateway` | Simple rate limit |

Demo: `python demos/registry_hub.py`

Hosted multi-tenant auth/routing/audit remains the paid Gateway tier — see [ROADMAP.md](../ROADMAP.md).
