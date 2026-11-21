# Contributing to A2AConnect

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

Frontend:

```bash
cd apps/web && npm install && npm run lint && npm run build
```

## Guidelines

- Keep the core library **SDK-agnostic** — no hard deps on LangGraph, CrewAI, OpenAI, etc.
- Prefer small, runnable demos under `demos/` over abstract samples.
- Document public behavior in `docs/` and keep `protocol/SPEC.md` aligned with `protocol/types.py`.
- Position clearly: complementary to LF A2A and MCP — not a rival wire standard.

## Pull requests

1. Add/adjust tests for peer, transport, or adapter changes.
2. Run `pytest` and (if you touch `apps/web`) `npm run build`.
3. Update docs when you change APIs or message types.
4. Keep commits focused.

## Code of conduct

Be respectful. This is an open-core interop project — assume good faith and precise technical feedback.
