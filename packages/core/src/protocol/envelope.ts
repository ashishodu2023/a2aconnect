import { createId, nowIso } from "./ids.js";
import {
  PROTOCOL_VERSION,
  type A2AEnvelope,
  type AgentId,
  type MessageType,
  type SessionId,
} from "./types.js";

export interface CreateEnvelopeOptions<TPayload> {
  type: MessageType;
  from: AgentId;
  to: AgentId | "*";
  payload: TPayload;
  correlationId?: string | undefined;
  sessionId?: SessionId | undefined;
  id?: string | undefined;
}

export function createEnvelope<TPayload>(
  options: CreateEnvelopeOptions<TPayload>,
): A2AEnvelope<MessageType, TPayload> {
  const envelope: A2AEnvelope<MessageType, TPayload> = {
    v: PROTOCOL_VERSION,
    id: options.id ?? createId("msg"),
    type: options.type,
    from: options.from,
    to: options.to,
    ts: nowIso(),
    payload: options.payload,
  };

  if (options.correlationId !== undefined) {
    envelope.correlationId = options.correlationId;
  }
  if (options.sessionId !== undefined) {
    envelope.sessionId = options.sessionId;
  }

  return envelope;
}

export function isEnvelope(value: unknown): value is A2AEnvelope {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === PROTOCOL_VERSION &&
    typeof v.id === "string" &&
    typeof v.type === "string" &&
    typeof v.from === "string" &&
    (typeof v.to === "string" || v.to === "*") &&
    typeof v.ts === "string" &&
    "payload" in v
  );
}
