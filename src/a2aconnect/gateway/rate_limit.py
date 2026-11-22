from __future__ import annotations

import time
from dataclasses import dataclass


@dataclass
class TokenBucket:
    """Token bucket rate limiter (Gateway preview)."""

    rate_per_sec: float
    capacity: float
    tokens: float | None = None
    updated_at: float | None = None

    def __post_init__(self) -> None:
        if self.tokens is None:
            self.tokens = float(self.capacity)
        if self.updated_at is None:
            self.updated_at = time.monotonic()

    def allow(self, cost: float = 1.0) -> bool:
        now = time.monotonic()
        assert self.tokens is not None and self.updated_at is not None
        elapsed = now - self.updated_at
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate_per_sec)
        self.updated_at = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
