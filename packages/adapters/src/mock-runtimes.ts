import type { TaskContext } from "@a2aconnect/core";
import type { RuntimeAdapter } from "./types.js";
import { createPassthroughAdapter } from "./passthrough.js";

/**
 * Simulated “graph-style” runtime (LangGraph-shaped DX without importing LangGraph).
 * Proves cross-runtime handoff in the demo: graph agent ↔ crew-style agent.
 */
export function createGraphStyleAdapter(options: {
  nodeName?: string;
  run: (input: unknown, ctx: TaskContext) => Promise<unknown>;
}): RuntimeAdapter {
  const nodeName = options.nodeName ?? "invoke";
  return createPassthroughAdapter(`graph-style:${nodeName}`, async (input, ctx) => {
    await ctx.emitEvent({ name: "runtime.enter", data: { runtime: "graph-style", nodeName } });
    const output = await options.run(input, ctx);
    await ctx.emitEvent({ name: "runtime.exit", data: { runtime: "graph-style", nodeName } });
    return output;
  });
}

/**
 * Simulated “crew-style” runtime (role/crew DX without importing CrewAI).
 */
export function createCrewStyleAdapter(options: {
  role?: string;
  run: (input: unknown, ctx: TaskContext) => Promise<unknown>;
}): RuntimeAdapter {
  const role = options.role ?? "worker";
  return createPassthroughAdapter(`crew-style:${role}`, async (input, ctx) => {
    await ctx.emitEvent({ name: "runtime.enter", data: { runtime: "crew-style", role } });
    const output = await options.run(input, ctx);
    await ctx.emitEvent({ name: "runtime.exit", data: { runtime: "crew-style", role } });
    return output;
  });
}
