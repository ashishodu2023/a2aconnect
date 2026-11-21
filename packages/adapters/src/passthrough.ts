import type { TaskHandler } from "@a2aconnect/core";
import type { BrainFn, RuntimeAdapter } from "./types.js";

/** Wrap any async function as a TaskHandler. */
export function fromAsyncFn(fn: BrainFn): TaskHandler {
  return async (ctx) => fn(ctx.offer.input, ctx);
}

export function createPassthroughAdapter(
  runtime: string,
  fn: BrainFn,
): RuntimeAdapter {
  return {
    runtime,
    toHandler: () => fromAsyncFn(fn),
  };
}
