# A2AConnect roadmap

## Shipped (OSS 0.1)

- [x] Python `AgentPeer` + local interop profile
- [x] Adapters (`from_async_fn`, graph/crew style)
- [x] Transports: in-memory, buffered, HTTP JSON stub
- [x] Policy + `MemoryAuditLog`
- [x] Executable demos + Next.js site at a2aconnect.dev
- [x] CLI (`a2aconnect doctor|demo|map|card`)
- [x] Gateway **OSS preview**: hosted auth & registry, edge routing & quotas, audit retention
- [x] Enterprise **OSS preview**: SSO / SCIM, VPC networking, SLA & support
- [x] Multi-host HTTP peer server (`HttpPeerServer`)
- [x] On-wire LF A2A bridge adapter (`LfA2AWireAdapter`)
- [x] OTLP / observability exporters (`MemorySpanExporter`, `OtlpJsonExporter`)

## Next

- [ ] Typed SDK generators / OpenAPI for envelopes
- [ ] Managed OTLP collectors + dashboards
- [ ] Full LF A2A compliance test suite against reference peers

## Gateway (commercial hosted)

- [ ] Multi-tenant hosted control plane
- [ ] Edge routing & quotas as a managed service
- [ ] Hosted audit retention with durability SLAs

## Enterprise (commercial hosted)

- [ ] Managed SSO / SCIM against customer IdPs
- [ ] VPC / private networking
- [ ] SLA + support desk
