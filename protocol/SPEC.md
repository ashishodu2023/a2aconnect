# A2AConnect Local Interop Profile v1.0

**Product:** A2AConnect · **Docs:** https://a2aconnect.dev · **Package:** `a2aconnect`

SDK-agnostic interop runtime for mixed agent fleets. Compatible with / complementary to **[LF A2A](https://a2a-protocol.org)**. Complements **MCP** (tools). **Not** a competing wire standard — this profile is the local/dev DX layer; a bridge to LF A2A on the wire is roadmap.

## Goals

- Handshake and capability discovery between peers that do not share an SDK
- Task handoff with progress + typed events on one transport
- Pluggable transports and governance hooks (policy / audit)

## Envelope

Every message is a JSON object:

| Field | Required | Description |
|-------|----------|-------------|
| `v` | yes | Profile version (`"1.0"`) |
| `id` | yes | Message id (`msg_…`) |
| `type` | yes | Message type (see below) |
| `from` | yes | Sender agent id |
| `to` | yes | Receiver agent id or `"*"` |
| `ts` | yes | ISO-8601 timestamp |
| `payload` | yes | Type-specific body |
| `correlationId` | no | Ties replies to a request |
| `sessionId` | no | Bound at `hello.ack` |

Python helper: `create_envelope(...)`.

## Message types

### Session

| Type | Direction | Payload (summary) |
|------|-----------|-------------------|
| `hello` | A→B | `{ "profile": AgentProfile }` |
| `hello.ack` | B→A | `{ "profile", "sessionId" }` |
| `ping` / `pong` | either | liveness |

### Capabilities

| Type | Payload |
|------|---------|
| `capabilities.query` | optional `{ "filter": ["cap.name", ...] }` |
| `capabilities.announce` | `{ "capabilities": [AgentCapability, ...] }` |

### Tasks

| Type | Payload (summary) |
|------|-------------------|
| `task.offer` | `taskId`, `goal`, `input`, `requiredCapabilities`, `timeoutMs`, `meta` |
| `task.accept` | `taskId` |
| `task.reject` | `taskId`, `reason` / error |
| `task.start` | `taskId` |
| `task.progress` | `taskId`, `percent`, `message` |
| `task.result` | `taskId`, `output` |
| `task.failed` | `taskId`, `code`, `message` |
| `task.cancel` | `taskId` |

### Other

| Type | Role |
|------|------|
| `event` | Named side-channel update (`name`, `data`, usually with `taskId`) |
| `error` | Protocol-level error |

## Flows

1. **Discovery** — `hello` → `hello.ack` (session) → optional `capabilities.query` / `announce`
2. **Negotiate** — `task.offer` lists `requiredCapabilities`; mismatch → `task.reject` (`CAPABILITY_MISMATCH`)
3. **Execute** — `accept` → `start` → `progress` / `event`* → `result` | `failed`
4. **Govern** — policy may deny offer/accept; audit records lifecycle

## Agent profile

```json
{
  "id": "researcher",
  "name": "Researcher",
  "version": "0.1.0",
  "description": "Graph-style research peer",
  "capabilities": [
    { "name": "research.web", "version": "1", "description": "Web-style research" }
  ]
}
```

## Error codes

`PROTOCOL_VERSION` · `UNKNOWN_TYPE` · `CAPABILITY_MISMATCH` · `TASK_NOT_FOUND` · `TIMEOUT` · `REJECTED` · `INTERNAL` · `INVALID_PAYLOAD`

## Transports

Profile is transport-agnostic. Reference implementations:

- In-memory bus (`create_bus`)
- Outbound buffer (`with_outbound_buffer`)
- HTTP JSON stub (`HttpJsonTransport`)

## Map to LF A2A

| This profile | LF A2A (conceptual) |
|--------------|---------------------|
| Agent profile + capabilities | Agent Card |
| `task.offer` … `result` / `failed` | Task lifecycle |
| `task.progress` + `event` | Streaming task updates |
| Policy + audit | Product governance (A2AConnect) |

Bridge adapter that speaks LF A2A on the wire is **roadmap**. Until then, use this profile for local fleets and tests.

## Map to MCP

MCP = agent ↔ tools/data. A2AConnect = agent ↔ agent handoff. Use both; do not collapse one into the other.

## Versioning

`PROTOCOL_VERSION = "1.0"`. Incompatible envelope changes bump `v` and are negotiated at hello time (reject with `PROTOCOL_VERSION` if unsupported).
