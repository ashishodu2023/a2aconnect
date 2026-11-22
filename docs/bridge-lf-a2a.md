# LF A2A bridge scaffold

A2AConnect does **not** replace [LF A2A](https://a2a-protocol.org). The bridge module maps concepts and emits a **stub Agent Card** for docs/tests.

```python
from a2aconnect import profile_to_agent_card_stub, LOCAL_TO_A2A

card = profile_to_agent_card_stub({
    "id": "researcher",
    "name": "Researcher",
    "capabilities": [{"name": "research.web"}],
})
```

CLI: `a2aconnect map` · `a2aconnect card --id researcher --capability research.web`

On-wire LF A2A adapter = roadmap.
