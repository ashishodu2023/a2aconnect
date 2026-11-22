# A2AConnect roadmap

## Shipped (OSS 0.1)

- [x] Python `AgentPeer` + local interop profile
- [x] Adapters (`from_async_fn`, graph/crew style)
- [x] Transports: in-memory, buffered, HTTP JSON stub
- [x] Policy + `MemoryAuditLog`
- [x] Executable demos + Next.js site at a2aconnect.dev
- [x] Gateway **preview**: registry, token gate, rate limit (in-process)
- [x] LF A2A bridge **scaffold** (conceptual Agent Card map)
- [x] CLI (`a2aconnect doctor|demo|map|card`)

## Next

- [ ] Real HTTP peer server (ASGI) for multi-host demos
- [ ] LF A2A on-wire bridge adapter (beyond scaffold)
- [ ] Typed SDK generators / OpenAPI for envelopes
- [ ] Observability exporters (OTLP)

## Gateway (commercial)

- [ ] Hosted auth & multi-tenant registry
- [ ] Routing, quotas, rate limits at the edge
- [ ] Hosted audit retention

## Enterprise

- [ ] SSO / SCIM
- [ ] VPC / private networking
- [ ] SLA + support
