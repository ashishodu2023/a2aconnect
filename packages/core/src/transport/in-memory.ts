import type { A2AEnvelope } from "../protocol/types.js";
import type { MessageHandler, Transport, Unsubscribe } from "./types.js";

/**
 * Shared in-process bus. Ideal for tests, demos, and single-process multi-agent apps.
 * Each Transport instance is a peer endpoint on the same bus.
 */
export class InMemoryBus {
  private readonly endpoints = new Map<string, Set<MessageHandler>>();
  private closed = false;

  createTransport(endpointId: string): Transport {
    if (this.closed) {
      throw new Error("InMemoryBus is closed");
    }
    if (!this.endpoints.has(endpointId)) {
      this.endpoints.set(endpointId, new Set());
    }

    const handlers = this.endpoints.get(endpointId)!;

    return {
      name: `in-memory:${endpointId}`,
      send: async (message: A2AEnvelope) => {
        if (this.closed) {
          throw new Error("InMemoryBus is closed");
        }
        await this.deliver(message);
      },
      subscribe: (handler: MessageHandler): Unsubscribe => {
        handlers.add(handler);
        return () => {
          handlers.delete(handler);
        };
      },
      close: async () => {
        handlers.clear();
        this.endpoints.delete(endpointId);
      },
    };
  }

  private async deliver(message: A2AEnvelope): Promise<void> {
    const targets: MessageHandler[] = [];

    if (message.to === "*") {
      for (const [endpointId, handlers] of this.endpoints) {
        if (endpointId === message.from) continue;
        for (const handler of handlers) targets.push(handler);
      }
    } else {
      const handlers = this.endpoints.get(message.to);
      if (handlers) {
        for (const handler of handlers) targets.push(handler);
      }
    }

    await Promise.all(
      targets.map(async (handler) => {
        await handler(message);
      }),
    );
  }

  async close(): Promise<void> {
    this.closed = true;
    this.endpoints.clear();
  }
}

export function createBus(): InMemoryBus {
  return new InMemoryBus();
}
