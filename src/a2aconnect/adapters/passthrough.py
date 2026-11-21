from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from a2aconnect.peer.agent_peer import TaskContext, TaskHandler

BrainFn = Callable[[Any, TaskContext], Awaitable[Any]]


def from_async_fn(fn: BrainFn) -> TaskHandler:
    async def handler(ctx: TaskContext) -> Any:
        return await fn(ctx.offer.get("input"), ctx)

    return handler
