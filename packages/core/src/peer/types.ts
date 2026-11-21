import type {
  A2AEnvelope,
  AgentCapability,
  AgentId,
  AgentProfile,
  EventPayload,
  TaskFailedPayload,
  TaskId,
  TaskOfferPayload,
  TaskProgressPayload,
  TaskResultPayload,
} from "../protocol/types.js";
import type { Transport } from "../transport/types.js";
import type { AuditHook, PolicyHook } from "./hooks.js";

export interface TaskContext {
  taskId: TaskId;
  offer: TaskOfferPayload;
  from: AgentId;
  reportProgress: (update: Omit<TaskProgressPayload, "taskId">) => Promise<void>;
  emitEvent: (event: Omit<EventPayload, "taskId">) => Promise<void>;
  isCancelled: () => boolean;
}

export type TaskHandler = (ctx: TaskContext) => Promise<unknown>;

export interface AgentPeerOptions {
  profile: AgentProfile;
  transport: Transport;
  /**
   * Map capability name → handler. Offers that require capabilities are accepted
   * only when every required capability has a registered handler (or a default).
   */
  handlers?: Record<string, TaskHandler>;
  /** Fallback handler when no capability-specific handler matches. */
  defaultHandler?: TaskHandler;
  /** Auto-reject offers that exceed this (ms). Default: no auto timeout. */
  defaultTaskTimeoutMs?: number;
  /** Called for every inbound envelope (debugging / observability). */
  onMessage?: (message: A2AEnvelope) => void;
  /**
   * Governance hooks (allowlists, deny rules). Standards leave this to the deployment —
   * these hooks are the product extensibility point for gateways / enterprise policy.
   */
  policy?: PolicyHook;
  /** Append-only audit trail for handshake, handoff, and policy decisions. */
  audit?: AuditHook;
}

export interface RemotePeer {
  agentId: AgentId;
  profile: AgentProfile;
  sessionId: string;
  capabilities: AgentCapability[];
}

export interface OfferTaskOptions {
  to: AgentId;
  goal: string;
  input?: unknown;
  requiredCapabilities?: string[];
  timeoutMs?: number;
  meta?: Record<string, unknown>;
  taskId?: TaskId;
  /**
   * Extra attempts after a failed/timeout outcome (not after reject).
   * Default 0 (single try). Uses exponential backoff between tries.
   */
  retries?: number;
}

export type TaskOutcome =
  | { status: "completed"; result: TaskResultPayload }
  | { status: "failed"; error: TaskFailedPayload }
  | { status: "rejected"; reason: string }
  | { status: "cancelled"; reason?: string };
