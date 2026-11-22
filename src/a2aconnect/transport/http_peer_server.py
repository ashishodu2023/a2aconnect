from __future__ import annotations

import asyncio
import json
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import unquote


@dataclass
class HttpPeerServer:
    """Multi-host HTTP peer server (stdlib asyncio).

    Endpoints:
      GET  /healthz
      POST /v1/envelope          — deliver an envelope to the recipient inbox
      GET  /v1/poll/{agent_id}   — drain pending envelopes for an agent
      GET  /v1/agents            — list agents that have inboxes

    Pair with HttpJsonTransport(endpoint=..., stub=False) for cross-process demos.
    """

    host: str = "127.0.0.1"
    port: int = 0
    max_inbox: int = 1000
    _server: asyncio.AbstractServer | None = field(default=None, init=False, repr=False)
    _inboxes: dict[str, deque[dict[str, Any]]] = field(
        default_factory=lambda: defaultdict(deque), init=False, repr=False
    )
    _bound_port: int | None = field(default=None, init=False)

    @property
    def base_url(self) -> str:
        if self._bound_port is None:
            raise RuntimeError("HttpPeerServer is not started")
        return f"http://{self.host}:{self._bound_port}"

    @property
    def bound_port(self) -> int:
        if self._bound_port is None:
            raise RuntimeError("HttpPeerServer is not started")
        return self._bound_port

    async def start(self) -> "HttpPeerServer":
        if self._server is not None:
            return self
        self._server = await asyncio.start_server(self._handle, self.host, self.port)
        sockets = self._server.sockets or []
        if not sockets:
            raise RuntimeError("HttpPeerServer failed to bind")
        self._bound_port = int(sockets[0].getsockname()[1])
        return self

    async def stop(self) -> None:
        if self._server is None:
            return
        self._server.close()
        await self._server.wait_closed()
        self._server = None
        self._bound_port = None
        self._inboxes.clear()

    def enqueue(self, agent_id: str, envelope: dict[str, Any]) -> None:
        box = self._inboxes[agent_id]
        box.append(envelope)
        while len(box) > self.max_inbox:
            box.popleft()

    def drain(self, agent_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
        box = self._inboxes.get(agent_id)
        if not box:
            return []
        out: list[dict[str, Any]] = []
        while box and len(out) < limit:
            out.append(box.popleft())
        return out

    async def _handle(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        try:
            request_line = await asyncio.wait_for(reader.readline(), timeout=5)
            if not request_line:
                return
            parts = request_line.decode("latin-1").strip().split()
            if len(parts) < 2:
                await self._respond(writer, 400, {"error": "bad_request"})
                return
            method, path = parts[0].upper(), parts[1]

            headers: dict[str, str] = {}
            while True:
                line = await asyncio.wait_for(reader.readline(), timeout=5)
                if line in (b"\r\n", b"\n", b""):
                    break
                text = line.decode("latin-1").rstrip("\r\n")
                if ":" in text:
                    k, v = text.split(":", 1)
                    headers[k.strip().lower()] = v.strip()

            length = int(headers.get("content-length", "0") or 0)
            body = await reader.readexactly(length) if length > 0 else b""

            if method == "GET" and path == "/healthz":
                await self._respond(writer, 200, {"ok": True, "service": "a2aconnect-http-peer"})
                return

            if method == "GET" and path == "/v1/agents":
                await self._respond(writer, 200, {"agents": sorted(self._inboxes.keys())})
                return

            if method == "POST" and path == "/v1/envelope":
                try:
                    payload = json.loads(body.decode("utf-8") or "{}")
                except json.JSONDecodeError:
                    await self._respond(writer, 400, {"error": "invalid_json"})
                    return
                if not isinstance(payload, dict):
                    await self._respond(writer, 400, {"error": "envelope_must_be_object"})
                    return
                target = payload.get("to")
                if not target or target == "*":
                    await self._respond(writer, 400, {"error": "missing_to"})
                    return
                self.enqueue(str(target), payload)
                await self._respond(writer, 202, {"accepted": True, "to": target})
                return

            if method == "GET" and path.startswith("/v1/poll/"):
                agent_id = unquote(path[len("/v1/poll/") :].split("?", 1)[0])
                messages = self.drain(agent_id)
                await self._respond(writer, 200, messages)
                return

            # Back-compat aliases used by HttpJsonTransport
            if method == "POST" and path in ("/", ""):
                try:
                    payload = json.loads(body.decode("utf-8") or "{}")
                except json.JSONDecodeError:
                    await self._respond(writer, 400, {"error": "invalid_json"})
                    return
                target = payload.get("to") if isinstance(payload, dict) else None
                if target and target != "*":
                    self.enqueue(str(target), payload)
                    await self._respond(writer, 202, {"accepted": True})
                    return
                await self._respond(writer, 400, {"error": "missing_to"})
                return

            if method == "GET" and path.startswith("/poll"):
                # /poll?agent=id or /poll/<id>
                agent_id = ""
                if "?" in path:
                    qs = path.split("?", 1)[1]
                    for pair in qs.split("&"):
                        if pair.startswith("agent="):
                            agent_id = unquote(pair.split("=", 1)[1])
                elif path.startswith("/poll/"):
                    agent_id = unquote(path[len("/poll/") :])
                await self._respond(writer, 200, self.drain(agent_id) if agent_id else [])
                return

            await self._respond(writer, 404, {"error": "not_found", "path": path})
        except Exception as exc:  # noqa: BLE001
            try:
                await self._respond(writer, 500, {"error": "internal", "detail": str(exc)})
            except Exception:  # noqa: BLE001
                pass
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:  # noqa: BLE001
                pass

    async def _respond(
        self,
        writer: asyncio.StreamWriter,
        status: int,
        payload: Any,
    ) -> None:
        body = json.dumps(payload).encode("utf-8")
        reason = {
            200: "OK",
            202: "Accepted",
            400: "Bad Request",
            404: "Not Found",
            500: "Internal Server Error",
        }.get(status, "OK")
        header = (
            f"HTTP/1.1 {status} {reason}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            f"Connection: close\r\n"
            f"\r\n"
        ).encode("latin-1")
        writer.write(header + body)
        await writer.drain()
