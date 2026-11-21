from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from a2aconnect.adapters.passthrough import from_async_fn
from a2aconnect.peer.agent_peer import TaskContext, TaskHandler


@dataclass
class RuntimeAdapter:
    runtime: str
    _handler: TaskHandler

    def to_handler(self) -> TaskHandler:
        return self._handler


def create_graph_style_adapter(
    *,
    run: Callable[[Any, TaskContext], Awaitable[Any]],
    node_name: str = "invoke",
) -> RuntimeAdapter:
    """Simulated graph-style runtime (LangGraph-shaped) without importing LangGraph."""

    async def wrapped(input: Any, ctx: TaskContext) -> Any:
        await ctx.emit_event(name="runtime.enter", data={"runtime": "graph-style", "nodeName": node_name})
        output = await run(input, ctx)
        await ctx.emit_event(name="runtime.exit", data={"runtime": "graph-style", "nodeName": node_name})
        return output

    return RuntimeAdapter(runtime=f"graph-style:{node_name}", _handler=from_async_fn(wrapped))


def create_crew_style_adapter(
    *,
    run: Callable[[Any, TaskContext], Awaitable[Any]],
    role: str = "worker",
) -> RuntimeAdapter:
    """Simulated crew-style runtime (CrewAI-shaped) without importing CrewAI."""

    async def wrapped(input: Any, ctx: TaskContext) -> Any:
        await ctx.emit_event(name="runtime.enter", data={"runtime": "crew-style", "role": role})
        output = await run(input, ctx)
        await ctx.emit_event(name="runtime.exit", data={"runtime": "crew-style", "role": role})
        return output

    return RuntimeAdapter(runtime=f"crew-style:{role}", _handler=from_async_fn(wrapped))
