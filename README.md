# A2AConnect

**Product & docs:** [https://a2aconnect.dev](https://a2aconnect.dev)  
**Source:** [github.com/ashishodu2023/a2aconnect](https://github.com/ashishodu2023/a2aconnect)  
**Runtime:** Python 3.11+ (`a2aconnect`) · **Site:** Node.js (Next.js) at `apps/web`

> **Standards:** Compatible with / complementary to **[LF A2A](https://a2a-protocol.org)** (peer agents). Complements **MCP** (tools).  
> A2AConnect is **not** a competing wire standard — it is the interop layer that makes mixed-runtime fleets usable.

**Any agent runtime can hand off work safely — without sharing an SDK.**

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Documentation hub |
| [Getting started](docs/getting-started.md) | Install + first handoff |
| [Architecture](docs/architecture.md) | Layers, flows, package map |
| [Python API](docs/python-api.md) | `AgentPeer`, handlers, outcomes |
| [Adapters](docs/adapters.md) | Wrap existing brains |
| [Transports](docs/transports.md) | Bus, buffer, HTTP stub |
| [Policy & audit](docs/policy-audit.md) | Governance hooks |
| [Interop SPEC](protocol/SPEC.md) | Envelopes & message types |
| [Demos](demos/README.md) | Executable agent→agent scripts |
| [Hosting](docs/hosting-a2aconnect-dev.md) | Deploy the Next.js site |
| [Contributing](CONTRIBUTING.md) | Dev setup & PR guide |
| [Changelog](CHANGELOG.md) | Release notes |

## Layout

| Path | Role |
|------|------|
| `src/a2aconnect/` | Core library — protocol, transports, `AgentPeer`, policy/audit, adapters |
| `demos/` | Executable agent→agent demos |
| `apps/web/` | Next.js marketing site for [a2aconnect.dev](https://a2aconnect.dev) |
| `apps/web_python_fastapi/` | Optional FastAPI/Jinja reference |
| `protocol/SPEC.md` | Local interop profile + LF A2A map |
| `docs/` | Guides and API docs |
| `tests/` | Pytest suite |

## Quickstart — Python core

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
python demos/support_desk.py      # support agents
python demos/incident_handoff.py  # incident agents
python demos/two_agents.py        # cross-runtime brief
python demos/quickstart.py        # minimal research handoff
```

```python
from a2aconnect import AgentPeer, create_bus, from_async_fn
# full walkthrough: docs/getting-started.md · demos/quickstart.py
```

## Frontend — Node.js (a2aconnect.dev)

```bash
cd apps/web
npm install
npm run dev    # http://127.0.0.1:4783
```

```bash
cd apps/web && npm run build && npm start
```

## Local checkout

If you keep a copy at `/home/ashishsverma/Downloads/a2aconnect`, refresh it from the release zip/bundle — cloud agents cannot write that path. See `LOCAL_PATH.txt`.

## Positioning

- LF A2A owns the peer **wire standard**; A2AConnect ships **adapters + DX + governance hooks** (Python)
- MCP owns **tools**; A2AConnect owns **agent↔agent handoff**
- Frameworks own in-stack graphs; A2AConnect connects them

## Open-core

| Tier | What you get |
|------|----------------|
| **OSS (MIT)** | `a2aconnect` layout, local transports, policy/audit |
| **Gateway** *(roadmap)* | Auth, routing, rate limits, hosted audit |
| **Enterprise** *(roadmap)* | SSO, VPC, retention, SLA |

## License

MIT — see [LICENSE](LICENSE)
