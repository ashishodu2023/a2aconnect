# A2AConnect Local Interop Profile v1.0

**Product:** A2AConnect · **Docs:** https://a2aconnect.dev · **npm:** `@a2aconnect/core`

This document describes the **local/dev interop profile** used by the A2AConnect TypeScript runtime: JSON envelopes over a pluggable transport for discovery, capability negotiation, task handoff, streaming events, and errors.

## Standards posture

| Standard | Relationship |
|----------|----------------|
| **LF A2A** (Linux Foundation / Google-origin) | Industry **peer agent** wire standard. A2AConnect is **compatible / complementary** — local DX + adapters + policy/audit that map to LF A2A concepts. **Not** a competing wire standard. |
| **MCP** | Agent↔**tools**/data. Complementary vertical; A2AConnect covers agent↔agent handoff and controls. |

Do **not** treat this local profile as a bid to replace LF A2A. A future A2AConnect transport adapter may speak LF A2A HTTP/JSON-RPC on the wire while keeping the same `AgentPeer` DX.

### Conceptual map → LF A2A

| This profile | LF A2A (conceptual) |
|--------------|---------------------|
| Agent `profile` + capabilities | Agent Card / skills |
| `hello` / `hello.ack` | Peer discovery / session |
| `task.offer` → accept/reject → start → progress → result/failed | Task lifecycle |
| `event` / `task.progress` | Streaming updates |
| `PolicyHook` / `AuditHook` | Deployment/gateway concerns left open by the standard |

## Design principles

1. **Interop runtime first** — delightful local transports and handoff DX.
2. **SDK-agnostic** — no required dependency on an LLM or agent framework.
3. **Capability negotiation** — peers accept work only when they can do it.
4. **Governance hooks** — policy allow/deny + audit trail at the peer boundary.
5. **Transport-pluggable** — in-memory now; LF A2A / HTTP / WS adapters later.
6. **Standards-friendly** — document mapping; bridge toward LF A2A; complement MCP.

## Envelope

```json
{
  "v": "1.0",
  "id": "msg_…",
  "type": "hello",
  "from": "agent-a",
  "to": "agent-b",
  "ts": "2026-11-21T21:00:00.000Z",
  "correlationId": "msg_…",
  "sessionId": "sess_…",
  "payload": {}
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `v` | yes | Local profile version. Must be `"1.0"` for this document. |
| `id` | yes | Unique message id. |
| `type` | yes | Message type (see below). |
| `from` | yes | Sender agent id. |
| `to` | yes | Recipient agent id, or `"*"` for broadcast (hello). |
| `ts` | yes | ISO-8601 timestamp. |
| `correlationId` | no | Id of the message being replied to. |
| `sessionId` | no | Session established by handshake. |
| `payload` | yes | Type-specific body (object; may be empty). |

## Message types

### Handshake

#### `hello`

```json
{ "profile": { "id": "researcher", "name": "Researcher", "capabilities": [{ "name": "research.web" }] } }
```

#### `hello.ack`

```json
{ "profile": { "…": "…" }, "sessionId": "sess_…" }
```

### Discovery

#### `capabilities.query`

```json
{ "filter": ["research.web"] }
```

`filter` is optional. Omitting it requests the full capability set.

#### `capabilities.announce`

```json
{ "capabilities": [{ "name": "research.web", "version": "1", "description": "Web research" }] }
```

### Task handoff

#### `task.offer`

```json
{
  "taskId": "task_…",
  "goal": "Research competitors for product X",
  "input": { "topic": "product X" },
  "requiredCapabilities": ["research.web"],
  "timeoutMs": 30000,
  "meta": {}
}
```

#### `task.accept` / `task.reject`

```json
{ "taskId": "task_…", "message": "accepted" }
```

```json
{ "taskId": "task_…", "reason": "Missing capabilities: research.web", "code": "CAPABILITY_MISMATCH" }
```

#### `task.start`

```json
{ "taskId": "task_…" }
```

#### `task.progress`

```json
{ "taskId": "task_…", "percent": 40, "message": "Scanning sources", "data": {} }
```

#### `task.result`

```json
{ "taskId": "task_…", "output": { "findings": ["…"] } }
```

#### `task.failed`

```json
{ "taskId": "task_…", "code": "INTERNAL", "message": "…", "details": {} }
```

#### `task.cancel`

```json
{ "taskId": "task_…", "reason": "Requester cancelled" }
```

### Streaming events

#### `event`

```json
{ "taskId": "task_…", "name": "source.found", "data": { "url": "https://…" } }
```

### Errors & liveness

#### `error`

```json
{ "code": "TIMEOUT", "message": "…", "retryable": true, "taskId": "task_…", "details": {} }
```

**Stable codes:** `PROTOCOL_VERSION`, `UNKNOWN_TYPE`, `CAPABILITY_MISMATCH`, `TASK_NOT_FOUND`, `TIMEOUT`, `REJECTED`, `INTERNAL`, `INVALID_PAYLOAD`.

#### `ping` / `pong`

Opaque `nonce` optional; `pong` echoes payload and sets `correlationId` to the ping’s `id`.

## Flows

### Handshake

```
A --hello--> B
A <--hello.ack-- B   (sessionId assigned)
```

### Task handoff

```
A --task.offer--> B
A <--task.accept|task.reject-- B
A <--task.start-- B
A <--task.progress|event-- B   (0..n)
A <--task.result|task.failed-- B
```

### Capability mismatch

If `requiredCapabilities` are not all present on B, B **must** `task.reject` with `CAPABILITY_MISMATCH`.

### Policy deny

If a `PolicyHook` denies offer or accept, the runtime rejects without running the handler and records `policy.deny` on the audit hook.

## Transport requirements

1. Delivers envelopes intact (JSON-serializable).
2. Routes by `to` (and supports `*` if broadcast is offered).
3. Does not interpret `payload` beyond delivery.
4. Provides subscribe + send + close semantics.

Reference transport: **in-memory bus**. Network / LF A2A transports are adapters.

## Non-goals (v1)

- Claiming A2AConnect is or replaces the LF A2A wire protocol
- Full LF A2A HTTP/JSON-RPC conformance (bridge planned)
- Authentication / durable stores (hooks only)
- Competing with MCP for tool access
