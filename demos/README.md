# A2AConnect executable demos

Real agent→agent handoffs you can run locally. **No API keys required.**

```bash
cd /path/to/a2aconnect
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

| Demo | Command | Agents | What you get |
|------|---------|--------|----------------|
| Support desk | `python demos/support_desk.py` | desk → intake → billing → reply | Classified ticket, refund decision, customer email |
| Incident handoff | `python demos/incident_handoff.py` | ops → commander → SRE | Investigation plan + findings + recommendation |
| Cross-runtime brief | `python demos/two_agents.py` | orchestrator → researcher → writer | Research JSON + markdown brief + audit |
| Minimal research | `python demos/quickstart.py` | orchestrator → researcher | Findings JSON + audit |

## Expected output

Each script prints structured JSON (or a markdown brief), then an audit trail of message types (`hello`, `task.offer`, `task.progress`, …), and ends with `=== … ok ===`.

## Learn more

- [Getting started](../docs/getting-started.md)
- [Python API](../docs/python-api.md)
- Product site examples: https://a2aconnect.dev/examples
