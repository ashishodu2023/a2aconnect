from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


async def with_retry(
    fn: Callable[[int], Awaitable[T]],
    *,
    attempts: int = 3,
    initial_delay_ms: float = 50,
    factor: float = 2,
    max_delay_ms: float = 2000,
    should_retry: Callable[[BaseException, int], bool] | None = None,
) -> T:
    """Async retry with exponential backoff."""
    retry_check = should_retry or (lambda _err, _attempt: True)
    last: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            return await fn(attempt)
        except BaseException as err:  # noqa: BLE001 — surface last error
            last = err
            if attempt >= attempts or not retry_check(err, attempt):
                raise
            delay = min(initial_delay_ms * (factor ** (attempt - 1)), max_delay_ms)
            await asyncio.sleep(delay / 1000.0)
    assert last is not None
    raise last
