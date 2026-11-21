/**
 * @a2aconnect/adapters — optional bridges. Core stays free of vendor SDKs.
 * Real LangGraph / CrewAI / OpenAI packs can follow this same RuntimeAdapter shape.
 */
export type { BrainFn, RuntimeAdapter } from "./types.js";
export { createPassthroughAdapter, fromAsyncFn } from "./passthrough.js";
export { createCrewStyleAdapter, createGraphStyleAdapter } from "./mock-runtimes.js";
