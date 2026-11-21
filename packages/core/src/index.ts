/**
 * @a2aconnect/core — A2AConnect SDK-agnostic agent interop runtime.
 * Docs: https://a2aconnect.dev
 * Compatible with / complementary to LF A2A; does not replace it.
 * Complements MCP (tools) for peer agent handoff + local DX + policy/audit hooks.
 */

export {
  PROTOCOL_VERSION,
  createEnvelope,
  createId,
  nowIso,
  isEnvelope,
  A2AError,
  errorPayload,
} from "./protocol/index.js";

export type {
  A2AEnvelope,
  AgentCapability,
  AgentId,
  AgentProfile,
  AnyPayload,
  CapabilitiesAnnouncePayload,
  CapabilitiesQueryPayload,
  ErrorCode,
  ErrorPayload,
  EventPayload,
  HelloAckPayload,
  HelloPayload,
  MessageId,
  MessageType,
  PingPayload,
  PongPayload,
  ProtocolVersion,
  SessionId,
  TaskAcceptPayload,
  TaskCancelPayload,
  TaskFailedPayload,
  TaskId,
  TaskOfferPayload,
  TaskProgressPayload,
  TaskRejectPayload,
  TaskResultPayload,
  TaskStartPayload,
} from "./protocol/index.js";

export {
  createBus,
  InMemoryBus,
  withOutboundBuffer,
  HttpJsonTransport,
  resetHttpJsonStubs,
} from "./transport/index.js";
export type {
  BufferedTransportOptions,
  HttpJsonTransportOptions,
  MessageHandler,
  Transport,
  Unsubscribe,
} from "./transport/index.js";

export {
  capabilityNames,
  filterCapabilities,
  hasAllCapabilities,
  matchScore,
  missingCapabilities,
} from "./discovery/index.js";

export { AgentPeer, MemoryAuditLog } from "./peer/index.js";
export type {
  AgentPeerOptions,
  AuditEvent,
  AuditEventType,
  AuditHook,
  OfferTaskOptions,
  PolicyDecision,
  PolicyHook,
  RemotePeer,
  TaskContext,
  TaskHandler,
  TaskOutcome,
} from "./peer/index.js";

export { fromAsyncFn } from "./adapters/index.js";
export { withRetry } from "./util/retry.js";
export type { RetryOptions } from "./util/retry.js";
