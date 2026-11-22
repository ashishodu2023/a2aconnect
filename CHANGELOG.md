# Changelog

## Unreleased

### Added (scope expansion)
- GitHub Actions CI (Python demos + Next.js build + TS tests)
- Makefile, CLI (`a2aconnect`)
- Gateway preview: registry, token gate, rate limit + `demos/registry_hub.py`
- LF A2A bridge scaffold + docs
- Site `/roadmap`, SECURITY.md, ROADMAP.md


### Added
- Live product site at https://www.a2aconnect.dev (Vercel + Namecheap DNS)
- Next.js `robots.ts` / `sitemap.ts` and Open Graph metadata
- README intention + high-level architecture diagrams

### Changed
- Development tracks GitHub `ashishodu2023/a2aconnect` as source of truth


All notable changes to A2AConnect are documented here.

## 0.1.0 — 2026-11-21

### Added

- Python `a2aconnect` package: `AgentPeer`, envelopes, in-memory / buffered / HTTP stub transports
- Adapters: `from_async_fn`, graph-style, crew-style
- Policy + `MemoryAuditLog` hooks
- Executable demos: `quickstart`, `two_agents`, `support_desk`, `incident_handoff`
- Next.js product site (`apps/web`) for a2aconnect.dev — architecture, examples, syntax-colored snippets
- Documentation suite under `docs/` and expanded `protocol/SPEC.md`
