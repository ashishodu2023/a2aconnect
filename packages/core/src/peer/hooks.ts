import type { A2AEnvelope, AgentId, TaskOfferPayload } from "../protocol/types.js";
import type { AgentProfile } from "../protocol/types.js";

/** Decision returned by policy hooks before offering or accepting work. */
export type PolicyDecision =
  | { allow: true }
  | { allow: false; reason: string };

export interface PolicyHook {
  /** Called on the requester before sending task.offer. */
  beforeOffer?(args: {
    from: AgentId;
    to: AgentId;
    offer: TaskOfferPayload;
  }): PolicyDecision | Promise<PolicyDecision>;

  /** Called on the worker before accepting a task.offer. */
  beforeAccept?(args: {
    from: AgentId;
    to: AgentId;
    offer: TaskOfferPayload;
    localProfile: AgentProfile;
  }): PolicyDecision | Promise<PolicyDecision>;
}

export type AuditEventType =
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
  | "task.failed"
  | "task.cancel"
  | "event"
  | "error"
  | "policy.deny";

export interface AuditEvent {
  type: AuditEventType;
  ts: string;
  agentId: AgentId;
  peerId?: AgentId | undefined;
  taskId?: string | undefined;
  detail?: unknown;
  envelope?: A2AEnvelope | undefined;
}

export interface AuditHook {
  record(event: AuditEvent): void | Promise<void>;
}

/** In-memory audit sink — useful for demos, tests, and local gateways. */
export class MemoryAuditLog implements AuditHook {
  readonly events: AuditEvent[] = [];

  record(event: AuditEvent): void {
    this.events.push(event);
  }

  clear(): void {
    this.events.length = 0;
  }
}
