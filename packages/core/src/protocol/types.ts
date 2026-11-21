/** A2A protocol version shipped with this reference implementation. */
export const PROTOCOL_VERSION = "1.0" as const;

export type ProtocolVersion = typeof PROTOCOL_VERSION;

/** Stable agent identifier on the wire. */
export type AgentId = string;

/** Unique message / task identifiers. */
export type MessageId = string;
export type TaskId = string;
export type SessionId = string;

export type MessageType =
  | "hello"
  | "hello.ack"
  | "capabilities.query"
  | "capabilities.announce"
  | "task.offer"
  | "task.accept"
  | "task.reject"
  | "task.start"
  | "task.progress"
  | "task.result"
  | "task.cancel"
  | "task.failed"
  | "event"
  | "error"
  | "ping"
  | "pong";

export type ErrorCode =
  | "PROTOCOL_VERSION"
  | "UNKNOWN_TYPE"
  | "CAPABILITY_MISMATCH"
  | "TASK_NOT_FOUND"
  | "TIMEOUT"
  | "REJECTED"
  | "INTERNAL"
  | "INVALID_PAYLOAD";

export interface AgentCapability {
  /** Machine-readable capability id, e.g. "research.web" or "write.summary". */
  name: string;
  /** Semver-ish or freeform version string. */
  version?: string;
  description?: string;
  /** Optional structured metadata for negotiation. */
  meta?: Record<string, unknown>;
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  version?: string;
  description?: string;
  capabilities: AgentCapability[];
}

export interface A2AEnvelope<TType extends MessageType = MessageType, TPayload = unknown> {
  v: ProtocolVersion;
  id: MessageId;
  type: TType;
  from: AgentId;
  to: AgentId | "*";
  ts: string;
  correlationId?: MessageId;
  sessionId?: SessionId;
  payload: TPayload;
}

export interface HelloPayload {
  profile: AgentProfile;
}

export interface HelloAckPayload {
  profile: AgentProfile;
  sessionId: SessionId;
}

export interface CapabilitiesQueryPayload {
  /** If set, only announce matching capability names. */
  filter?: string[] | undefined;
}

export interface CapabilitiesAnnouncePayload {
  capabilities: AgentCapability[];
}

export interface TaskOfferPayload {
  taskId: TaskId;
  goal: string;
  input?: unknown;
  requiredCapabilities?: string[];
  timeoutMs?: number;
  meta?: Record<string, unknown>;
}

export interface TaskAcceptPayload {
  taskId: TaskId;
  message?: string;
}

export interface TaskRejectPayload {
  taskId: TaskId;
  reason: string;
  code?: ErrorCode;
}

export interface TaskStartPayload {
  taskId: TaskId;
}

export interface TaskProgressPayload {
  taskId: TaskId;
  percent?: number;
  message?: string;
  data?: unknown;
}

export interface TaskResultPayload {
  taskId: TaskId;
  output: unknown;
}

export interface TaskCancelPayload {
  taskId: TaskId;
  reason?: string;
}

export interface TaskFailedPayload {
  taskId: TaskId;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface EventPayload {
  taskId?: TaskId;
  name: string;
  data?: unknown;
}

export interface ErrorPayload {
  code: ErrorCode;
  message: string;
  retryable?: boolean;
  details?: unknown;
  taskId?: TaskId;
}

export interface PingPayload {
  nonce?: string;
}

export interface PongPayload {
  nonce?: string;
}

export type AnyPayload =
  | HelloPayload
  | HelloAckPayload
  | CapabilitiesQueryPayload
  | CapabilitiesAnnouncePayload
  | TaskOfferPayload
  | TaskAcceptPayload
  | TaskRejectPayload
  | TaskStartPayload
  | TaskProgressPayload
  | TaskResultPayload
  | TaskCancelPayload
  | TaskFailedPayload
  | EventPayload
  | ErrorPayload
  | PingPayload
  | PongPayload;
