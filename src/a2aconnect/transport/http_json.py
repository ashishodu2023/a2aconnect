from __future__ import annotations

import asyncio
from typing import Any

from a2aconnect.protocol.envelope import is_envelope
from a2aconnect.transport.types import MessageHandler, Unsubscribe

_stub_inboxes: dict[str, list[MessageHandler]] = {}


def reset_http_json_stubs() -> None:
    _stub_inboxes.clear()


class HttpJsonTransport:
    """HTTP JSON transport stub. With stub=True, routes in-process (no network)."""

    def __init__(
        self,
        *,
        endpoint: str,
        stub: bool = False,
        agent_id: str | None = None,
        poll_interval_ms: float = 250,
    ) -> None:
        self.endpoint = endpoint.rstrip("/")
        self.stub = stub
        self.agent_id = agent_id or self.endpoint
        self.poll_interval_ms = poll_interval_ms
        self.name = f"http-json:{self.endpoint}"
        self._handlers: set[MessageHandler] = set()
        self._closed = False
        self._poll_task: asyncio.Task[None] | None = None
        if self.stub:
            _stub_inboxes.setdefault(self.agent_id, [])

    async def send(self, message: dict[str, Any]) -> None:
        if self._closed:
            raise RuntimeError("HttpJsonTransport is closed")
        if self.stub:
            target = None if message.get("to") == "*" else message.get("to")
            if target:
                handlers = list(_stub_inboxes.get(str(target), []))
            else:
                handlers = [
                    h
                    for eid, hs in _stub_inboxes.items()
                    if eid != message.get("from")
                    for h in hs
                ]
            await asyncio.gather(*[_invoke(h, message) for h in handlers])
            return

        import urllib.request

        data = __import__("json").dumps(message).encode("utf-8")
        req = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={"content-type": "application/json", "accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            if getattr(resp, "status", 200) >= 400:
                raise RuntimeError(f"HttpJsonTransport send failed: {resp.status}")

    def subscribe(self, handler: MessageHandler) -> Unsubscribe:
        self._handlers.add(handler)
        if self.stub:
            _stub_inboxes.setdefault(self.agent_id, []).append(handler)

            def unsub() -> None:
                self._handlers.discard(handler)
                lst = _stub_inboxes.get(self.agent_id, [])
                _stub_inboxes[self.agent_id] = [h for h in lst if h is not handler]

            return unsub

        if self._poll_task is None:
            self._poll_task = asyncio.create_task(self._poll_loop())

        def unsub_net() -> None:
            self._handlers.discard(handler)

        return unsub_net

    async def _poll_loop(self) -> None:
        while not self._closed and not self.stub:
            await asyncio.sleep(self.poll_interval_ms / 1000.0)
            # Soft-fail poll; real gateway implements /poll.
            try:
                import json
                import urllib.request

                req = urllib.request.Request(
                    f"{self.endpoint}/poll",
                    headers={"accept": "application/json"},
                    method="GET",
                )
                with urllib.request.urlopen(req, timeout=10) as resp:  # noqa: S310
                    body = json.loads(resp.read().decode("utf-8"))
                messages = body if isinstance(body, list) else [body]
                for item in messages:
                    if is_envelope(item):
                        await asyncio.gather(*[_invoke(h, item) for h in self._handlers])
            except Exception:  # noqa: BLE001
                continue

    async def close(self) -> None:
        self._closed = True
        self._handlers.clear()
        if self._poll_task is not None:
            self._poll_task.cancel()
            try:
                await self._poll_task
            except asyncio.CancelledError:
                pass
            self._poll_task = None
        if self.stub:
            _stub_inboxes.pop(self.agent_id, None)


async def _invoke(handler: MessageHandler, message: dict[str, Any]) -> None:
    result = handler(message)
    if asyncio.iscoroutine(result):
        await result
