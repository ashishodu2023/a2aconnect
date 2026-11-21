import type { A2AEnvelope } from "../protocol/types.js";

export type MessageHandler = (message: A2AEnvelope) => void | Promise<void>;
export type Unsubscribe = () => void;

/**
 * Transport is the only I/O seam. Core never depends on HTTP, WS, or an LLM SDK.
 * Ship InMemoryTransport for local demos; adapters can wrap any channel.
 */
export interface Transport {
  readonly name: string;
  send(message: A2AEnvelope): Promise<void>;
  subscribe(handler: MessageHandler): Unsubscribe;
  close(): Promise<void>;
}
