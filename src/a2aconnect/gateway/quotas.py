from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class QuotaStatus:
    ok: bool
    remaining: int
    limit: int
    reason: str | None = None


@dataclass
class QuotaLedger:
    """Per-tenant / per-key hard quotas (Gateway preview).

    Complements TokenBucket rate limiting with countable allotments that reset
    only when explicitly refilled — useful for daily offer caps.
    """

    limits: dict[str, int] = field(default_factory=dict)
    used: dict[str, int] = field(default_factory=dict)

    def set_limit(self, key: str, limit: int) -> None:
        self.limits[key] = max(0, int(limit))
        self.used.setdefault(key, 0)

    def remaining(self, key: str) -> int:
        limit = self.limits.get(key)
        if limit is None:
            return 10**9
        return max(0, limit - self.used.get(key, 0))

    def allow(self, key: str, cost: int = 1) -> QuotaStatus:
        limit = self.limits.get(key)
        if limit is None:
            return QuotaStatus(ok=True, remaining=10**9, limit=10**9)
        current = self.used.get(key, 0)
        if current + cost > limit:
            return QuotaStatus(
                ok=False,
                remaining=max(0, limit - current),
                limit=limit,
                reason="quota_exceeded",
            )
        self.used[key] = current + cost
        return QuotaStatus(ok=True, remaining=limit - self.used[key], limit=limit)

    def refill(self, key: str) -> None:
        self.used[key] = 0
