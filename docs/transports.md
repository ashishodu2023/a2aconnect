# Transports

Peers speak the same envelopes; transports only move bytes/objects.

## In-memory bus (default for demos)

```python
from a2aconnect import create_bus

bus = create_bus()
t_a = bus.create_transport("orchestrator")
t_b = bus.create_transport("researcher")
# … pass into AgentPeer …
await bus.close()
```

Best for unit tests and single-process demos.

## Outbound buffer (backpressure)

```python
from a2aconnect import with_outbound_buffer

transport = with_outbound_buffer(bus.create_transport("writer"))
```

Queues outbound messages so a slow peer does not block the sender loop. Used in `demos/two_agents.py`.

## HTTP JSON stub

```python
from a2aconnect import HttpJsonTransport, reset_http_json_stubs

# Process-local stub registry for tests / early multi-host experiments
reset_http_json_stubs()
transport = HttpJsonTransport(endpoint_id="worker", base_url="http://127.0.0.1:9")
```

Same envelope shape over HTTP. Production edge routing is roadmap (Gateway tier).

## Choosing a transport

| Situation | Choice |
|-----------|--------|
| Local demo / pytest | `create_bus()` |
| Burst progress/events | `with_outbound_buffer(...)` |
| Multi-process experiments | `HttpJsonTransport` stub |
| Auth, routing, multi-tenant | Gateway *(roadmap)* |

Peer logic (`hello`, `offer_task`, handlers, policy, audit) stays unchanged when you swap transports.
