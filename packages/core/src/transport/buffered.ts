import type { A2AEnvelope } from "../protocol/types.js";
import type { MessageHandler, Transport, Unsubscribe } from "./types.js";

export interface BufferedTransportOptions {
  /** Max queued outbound messages before send() waits / rejects. Default 256. */
  highWaterMark?: number;
  /**
   * When the queue is full: "wait" (backpressure) or "drop-oldest" or "reject".
   * Default "wait".
   */
  overflow?: "wait" | "drop-oldest" | "reject";
}

/**
 * Wraps any Transport with an outbound queue for backpressure-friendly sends.
 * Suitable for bursty local demos and as a pattern for network adapters.
 */
export function withOutboundBuffer(
  inner: Transport,
  options: BufferedTransportOptions = {},
): Transport {
  const highWaterMark = options.highWaterMark ?? 256;
  const overflow = options.overflow ?? "wait";
  const queue: A2AEnvelope[] = [];
  let draining = false;
  let closed = false;
  const waiters: Array<() => void> = [];

  const wake = () => {
    const w = waiters.shift();
    if (w) w();
  };

  const drain = async () => {
    if (draining) return;
    draining = true;
    try {
      while (queue.length > 0 && !closed) {
        const next = queue.shift()!;
        wake();
        await inner.send(next);
      }
    } finally {
      draining = false;
      if (queue.length > 0 && !closed) {
        void drain();
      }
    }
  };

  return {
    name: `buffered(${inner.name})`,
    send: async (message) => {
      if (closed) throw new Error("BufferedTransport is closed");

      if (queue.length >= highWaterMark) {
        if (overflow === "reject") {
          throw new Error(`Outbound queue full (highWaterMark=${highWaterMark})`);
        }
        if (overflow === "drop-oldest") {
          queue.shift();
        } else {
          await new Promise<void>((resolve) => {
            waiters.push(resolve);
          });
        }
      }

      queue.push(message);
      void drain();
    },
    subscribe: (handler: MessageHandler): Unsubscribe => inner.subscribe(handler),
    close: async () => {
      closed = true;
      queue.length = 0;
      while (waiters.length) wake();
      await inner.close();
    },
  };
}
