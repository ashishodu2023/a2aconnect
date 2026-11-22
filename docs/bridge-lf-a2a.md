# LF A2A bridge

A2AConnect does **not** replace [LF A2A](https://a2a-protocol.org). Use the bridge to map local envelopes to LF A2A–shaped JSON.

```python
from a2aconnect import LfA2AWireAdapter, profile_to_agent_card_stub

bridge = LfA2AWireAdapter()
a2a = bridge.to_a2a(local_envelope)      # → tasks/send, tasks/status, …
local = bridge.from_a2a(a2a)             # round-trip back to A2AConnect
card = bridge.agent_card(profile, url="http://peer:8080")
```

CLI: `a2aconnect map` · `a2aconnect card --id researcher --capability research.web`

Demo: `python demos/next_stack.py`
