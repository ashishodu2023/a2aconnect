from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any, Protocol

MessageHandler = Callable[[dict[str, Any]], Awaitable[None] | None]
Unsubscribe = Callable[[], None]


class Transport(Protocol):
    name: str

    async def send(self, message: dict[str, Any]) -> None: ...

    def subscribe(self, handler: MessageHandler) -> Unsubscribe: ...

    async def close(self) -> None: ...
