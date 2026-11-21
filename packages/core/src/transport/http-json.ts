import type { A2AEnvelope } from "../protocol/types.js";
import { isEnvelope } from "../protocol/envelope.js";
import type { MessageHandler, Transport, Unsubscribe } from "./types.js";

export interface HttpJsonTransportOptions {
  /** Base URL of a peer inbox, e.g. http://127.0.0.1:7841/a2a */
  endpoint: string;
  /** Optional fetch implementation (defaults to global fetch). */
  fetch?: typeof fetch;
  /** Poll interval for pull-mode receive. Default 250ms. */
  pollIntervalMs?: number;
  /**
   * Stub mode: do not hit the network. Enqueues locally and delivers via
   * an optional in-process handler registry keyed by endpoint.
   * Useful for tests and demos until a real gateway exists.
   */
  stub?: boolean;
  /** Agent id used when registering this transport in stub mode. */
  agentId?: string;
}

/** Shared stub registry so multiple HttpJsonTransport stubs can exchange messages. */
const stubInboxes = new Map<string, MessageHandler[]>();

/**
 * HTTP JSON transport stub — POST envelopes to `endpoint`, optional poll receive.
 *
 * v1 ships as a **stub/skeleton** for the commercial gateway path. With `stub: true`,
 * messages route in-process (no network). Wire a real inbox server later without
 * changing AgentPeer.
 */
export class HttpJsonTransport implements Transport {
  readonly name: string;
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly stub: boolean;
  private readonly agentId: string;
  private readonly handlers = new Set<MessageHandler>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(options: HttpJsonTransportOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? 250;
    this.stub = options.stub ?? false;
    this.agentId = options.agentId ?? this.endpoint;
    this.name = `http-json:${this.endpoint}`;

    if (this.stub) {
      if (!stubInboxes.has(this.agentId)) {
        stubInboxes.set(this.agentId, []);
      }
    }
  }

  async send(message: A2AEnvelope): Promise<void> {
    if (this.closed) throw new Error("HttpJsonTransport is closed");

    if (this.stub) {
      const target = message.to === "*" ? null : message.to;
      if (target) {
        const handlers = stubInboxes.get(target) ?? [];
        await Promise.all(handlers.map((h) => h(message)));
      } else {
        for (const [id, handlers] of stubInboxes) {
          if (id === message.from) continue;
          await Promise.all(handlers.map((h) => h(message)));
        }
      }
      return;
    }

    const res = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      throw new Error(`HttpJsonTransport send failed: ${res.status} ${res.statusText}`);
    }
  }

  subscribe(handler: MessageHandler): Unsubscribe {
    this.handlers.add(handler);

    if (this.stub) {
      const list = stubInboxes.get(this.agentId) ?? [];
      list.push(handler);
      stubInboxes.set(this.agentId, list);
      return () => {
        this.handlers.delete(handler);
        const next = (stubInboxes.get(this.agentId) ?? []).filter((h) => h !== handler);
        stubInboxes.set(this.agentId, next);
      };
    }

    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        void this.pollOnce();
      }, this.pollIntervalMs);
    }

    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0 && this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    };
  }

  private async pollOnce(): Promise<void> {
    if (this.closed || this.stub) return;
    try {
      const res = await this.fetchImpl(`${this.endpoint}/poll`, {
        method: "GET",
        headers: { accept: "application/json" },
      });
      if (!res.ok) return;
      const body: unknown = await res.json();
      const messages = Array.isArray(body) ? body : [body];
      for (const item of messages) {
        if (!isEnvelope(item)) continue;
        await Promise.all([...this.handlers].map((h) => h(item)));
      }
    } catch {
      // Poll errors are soft — callers rely on timeouts/retries at the peer layer.
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    this.handlers.clear();
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.stub) {
      stubInboxes.delete(this.agentId);
    }
  }
}

/** Test helper: clear stub inboxes between cases. */
export function resetHttpJsonStubs(): void {
  stubInboxes.clear();
}
