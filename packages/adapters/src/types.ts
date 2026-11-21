import type { TaskContext, TaskHandler } from "@a2aconnect/core";

/**
 * RuntimeAdapter — wrap an existing agent “brain” as an A2AConnect TaskHandler.
 * No hard dependency on LangChain, CrewAI, OpenAI Agents, etc.
 */
export interface RuntimeAdapter {
  readonly runtime: string;
  toHandler(): TaskHandler;
}

export type BrainFn = (input: unknown, ctx: TaskContext) => Promise<unknown>;
