# Multi-host HTTP peer server

`HttpPeerServer` is a stdlib asyncio HTTP peer for cross-process envelope delivery.

```python
from a2aconnect import HttpPeerServer

server = HttpPeerServer(host="127.0.0.1", port=8765)
await server.start()
# POST {base}/v1/envelope   — deliver envelope (uses `to`)
# GET  {base}/v1/poll/{id}  — drain inbox
# GET  {base}/healthz
await server.stop()
```

Pair with `HttpJsonTransport(endpoint=server.base_url, agent_id="worker", stub=False)`.

Demo: `python demos/next_stack.py`
