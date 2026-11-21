import type { AgentCapability } from "../protocol/types.js";

export function capabilityNames(capabilities: AgentCapability[]): string[] {
  return capabilities.map((c) => c.name);
}

export function hasAllCapabilities(
  available: AgentCapability[],
  required: string[] | undefined,
): boolean {
  if (!required || required.length === 0) return true;
  const names = new Set(capabilityNames(available));
  return required.every((name) => names.has(name));
}

export function missingCapabilities(
  available: AgentCapability[],
  required: string[] | undefined,
): string[] {
  if (!required || required.length === 0) return [];
  const names = new Set(capabilityNames(available));
  return required.filter((name) => !names.has(name));
}

export function filterCapabilities(
  capabilities: AgentCapability[],
  filter: string[] | undefined,
): AgentCapability[] {
  if (!filter || filter.length === 0) return [...capabilities];
  const wanted = new Set(filter);
  return capabilities.filter((c) => wanted.has(c.name));
}

/**
 * Simple match score for optional ranking: fraction of required capabilities present.
 */
export function matchScore(
  available: AgentCapability[],
  required: string[] | undefined,
): number {
  if (!required || required.length === 0) return 1;
  const names = new Set(capabilityNames(available));
  const hits = required.filter((name) => names.has(name)).length;
  return hits / required.length;
}
