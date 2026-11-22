from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class VpcNetworkPolicy:
    """VPC-style allowlist for peer endpoints (Enterprise preview).

    Only endpoints matching allowed CIDR-like prefixes or exact hosts may be
    registered or routed. Hosted Enterprise enforces this at the network edge.
    """

    allowed_hosts: list[str] = field(default_factory=list)
    allowed_prefixes: list[str] = field(default_factory=list)
    deny_public_by_default: bool = True

    def allow(self, endpoint: str | None) -> bool:
        if not endpoint:
            return False
        host = endpoint
        if "://" in endpoint:
            host = endpoint.split("://", 1)[1]
        host = host.split("/", 1)[0].split(":", 1)[0].lower()

        if host in {h.lower() for h in self.allowed_hosts}:
            return True
        for prefix in self.allowed_prefixes:
            if host.startswith(prefix.lower()):
                return True
        if not self.deny_public_by_default and not self.allowed_hosts and not self.allowed_prefixes:
            return True
        return False

    def assert_allowed(self, endpoint: str | None) -> None:
        if not self.allow(endpoint):
            raise PermissionError(f"endpoint blocked by VPC policy: {endpoint!r}")
