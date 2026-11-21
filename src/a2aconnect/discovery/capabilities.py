from __future__ import annotations

from a2aconnect.protocol.types import AgentCapability


def capability_names(capabilities: list[AgentCapability]) -> list[str]:
    return [c["name"] for c in capabilities]


def has_all_capabilities(
    available: list[AgentCapability], required: list[str] | None
) -> bool:
    if not required:
        return True
    names = set(capability_names(available))
    return all(name in names for name in required)


def missing_capabilities(
    available: list[AgentCapability], required: list[str] | None
) -> list[str]:
    if not required:
        return []
    names = set(capability_names(available))
    return [name for name in required if name not in names]


def filter_capabilities(
    capabilities: list[AgentCapability], filt: list[str] | None
) -> list[AgentCapability]:
    if not filt:
        return list(capabilities)
    wanted = set(filt)
    return [c for c in capabilities if c["name"] in wanted]


def match_score(available: list[AgentCapability], required: list[str] | None) -> float:
    if not required:
        return 1.0
    names = set(capability_names(available))
    hits = sum(1 for name in required if name in names)
    return hits / len(required)
