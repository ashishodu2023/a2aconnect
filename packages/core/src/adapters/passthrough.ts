import type { TaskContext, TaskHandler } from "../peer/types.js";

/**
 * Optional adapter seam — wrap any callable as a TaskHandler.
 * No dependency on LangChain, CrewAI, OpenAI Agents, etc.
 * Product adapters (those SDKs) live outside core and call this pattern.
 */
export function fromAsyncFn(
  fn: (input: unknown, ctx: TaskContext) => Promise<unknown>,
): TaskHandler {
  return async (ctx) => fn(ctx.offer.input, ctx);
}
