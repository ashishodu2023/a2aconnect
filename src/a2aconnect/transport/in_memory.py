from __future__ import annotations

import asyncio
from typing import Any

from a2aconnect.transport.types import MessageHandler, Transport, Unsubscribe


class InMemoryBus:
    """Shared in-process bus for demos and tests."""

    def __init__(self) -> None:
        self._endpoints: dict[str, set[MessageHandler]] = {}
        self._closed = False

    def create_transport(self, endpoint_id: str) -> Transport:
        if self._closed:
            raise RuntimeError("InMemoryBus is closed")
        self._endpoints.setdefault(endpoint_id, set())
        handlers = self._endpoints[endpoint_id]
        bus = self

        class _Endpoint:
            name = f"in-memory:{endpoint_id}"

            async def send(self, message: dict[str, Any]) -> None:
                if bus._closed:
                    raise RuntimeError("InMemoryBus is closed")
                await bus._deliver(message)

            def subscribe(self, handler: MessageHandler) -> Unsubscribe:
                handlers.add(handler)

                def unsub() -> None:
                    handlers.discard(handler)

                return unsub

            async def close(self) -> None:
                handlers.clear()
                bus._endpoints.pop(endpoint_id, None)

        return _Endpoint()  # type: ignore[return-value]

    async def _deliver(self, message: dict[str, Any]) -> None:
        targets: list[MessageHandler] = []
        dest = message.get("to")
        if dest == "*":
            for eid, handlers in self._endpoints.items():
                if eid == message.get("from"):
                    continue
                targets.extend(handlers)
        else:
            targets.extend(self._endpoints.get(str(dest), set()))

        async def _call(handler: MessageHandler) -> None:
            result = handler(message)
            if asyncio.iscoroutine(result):
                await result

        await asyncio.gather(*[_call(h) for h in targets])

    async def close(self) -> None:
        self._closed = True
        self._endpoints.clear()


def create_bus() -> InMemoryBus:
    return InMemoryBus()
