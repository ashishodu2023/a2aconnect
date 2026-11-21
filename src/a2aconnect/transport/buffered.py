from __future__ import annotations

import asyncio
from typing import Any, Literal

from a2aconnect.transport.types import MessageHandler, Transport, Unsubscribe


def with_outbound_buffer(
    inner: Transport,
    *,
    high_water_mark: int = 256,
    overflow: Literal["wait", "drop-oldest", "reject"] = "wait",
) -> Transport:
    """Wrap a transport with an outbound queue for backpressure-friendly sends."""
    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=high_water_mark)
    closed = False
    drain_task: asyncio.Task[None] | None = None

    async def _drain() -> None:
        nonlocal drain_task
        try:
            while not closed:
                message = await queue.get()
                try:
                    await inner.send(message)
                finally:
                    queue.task_done()
        except asyncio.CancelledError:
            return

    def _ensure_drain() -> None:
        nonlocal drain_task
        if drain_task is None or drain_task.done():
            drain_task = asyncio.create_task(_drain())

    class _Buffered:
        name = f"buffered({inner.name})"

        async def send(self, message: dict[str, Any]) -> None:
            if closed:
                raise RuntimeError("BufferedTransport is closed")
            if overflow == "reject" and queue.full():
                raise RuntimeError(f"Outbound queue full (high_water_mark={high_water_mark})")
            if overflow == "drop-oldest" and queue.full():
                try:
                    queue.get_nowait()
                    queue.task_done()
                except asyncio.QueueEmpty:
                    pass
            await queue.put(message)
            _ensure_drain()

        def subscribe(self, handler: MessageHandler) -> Unsubscribe:
            return inner.subscribe(handler)

        async def close(self) -> None:
            nonlocal closed, drain_task
            closed = True
            if drain_task is not None:
                drain_task.cancel()
                try:
                    await drain_task
                except asyncio.CancelledError:
                    pass
                drain_task = None
            await inner.close()

    return _Buffered()  # type: ignore[return-value]
