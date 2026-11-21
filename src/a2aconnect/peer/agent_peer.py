from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from a2aconnect.discovery.capabilities import (
    filter_capabilities,
    has_all_capabilities,
    missing_capabilities,
)
from a2aconnect.peer.hooks import AuditEvent, AuditHook, MemoryAuditLog, PolicyDecision
from a2aconnect.protocol.envelope import create_envelope
from a2aconnect.protocol.errors import A2AError
from a2aconnect.protocol.ids import create_id, now_iso
from a2aconnect.protocol.types import PROTOCOL_VERSION, AgentId, AgentProfile
from a2aconnect.transport.types import Transport, Unsubscribe
from a2aconnect.util.retry import with_retry

TaskHandler = Callable[["TaskContext"], Awaitable[Any]]


@dataclass
class TaskContext:
    task_id: str
    offer: dict[str, Any]
    from_agent: AgentId
    _report: Callable[[dict[str, Any]], Awaitable[None]]
    _emit: Callable[[dict[str, Any]], Awaitable[None]]
    _is_cancelled: Callable[[], bool]

    async def report_progress(self, **update: Any) -> None:
        await self._report({"taskId": self.task_id, **update})

    async def emit_event(self, *, name: str, data: Any = None) -> None:
        payload: dict[str, Any] = {"taskId": self.task_id, "name": name}
        if data is not None:
            payload["data"] = data
        await self._emit(payload)

    def is_cancelled(self) -> bool:
        return self._is_cancelled()


@dataclass
class RemotePeer:
    agent_id: AgentId
    profile: AgentProfile
    session_id: str
    capabilities: list[Any]


@dataclass
class _PendingOffer:
    future: asyncio.Future[dict[str, Any]]
    progress: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    timer: asyncio.TimerHandle | None = None


class AgentPeer:
    """SDK-agnostic interop endpoint. Wire any async brain behind TaskHandler callbacks."""

    def __init__(
        self,
        *,
        profile: AgentProfile,
        transport: Transport,
        handlers: dict[str, TaskHandler] | None = None,
        default_handler: TaskHandler | None = None,
        default_task_timeout_ms: float | None = None,
        on_message: Callable[[dict[str, Any]], None] | None = None,
        policy: Any | None = None,
        audit: AuditHook | MemoryAuditLog | None = None,
    ) -> None:
        self.profile = profile
        self._transport = transport
        self._handlers = handlers or {}
        self._default_handler = default_handler
        self._default_task_timeout_ms = default_task_timeout_ms
        self._on_message = on_message
        self._policy = policy
        self._audit = audit
        self._unsub: Unsubscribe | None = None
        self._started = False
        self._remotes: dict[AgentId, RemotePeer] = {}
        self._pending: dict[str, _PendingOffer] = {}
        self._local_tasks: dict[str, dict[str, Any]] = {}

    @property
    def id(self) -> AgentId:
        return self.profile["id"]

    def start(self) -> None:
        if self._started:
            return
        self._started = True

        def _sync_handler(message: dict[str, Any]) -> Awaitable[None]:
            return self._handle_inbound(message)

        self._unsub = self._transport.subscribe(_sync_handler)

    async def stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None
        self._started = False
        for pending in list(self._pending.values()):
            if pending.timer:
                pending.timer.cancel()
            if not pending.future.done():
                pending.future.set_result({"status": "cancelled", "reason": "peer stopped"})
        self._pending.clear()
        await self._transport.close()

    def list_remotes(self) -> list[RemotePeer]:
        return list(self._remotes.values())

    def get_remote(self, agent_id: AgentId) -> RemotePeer | None:
        return self._remotes.get(agent_id)

    def _ensure_started(self) -> None:
        if not self._started:
            raise A2AError("INTERNAL", "AgentPeer.start() must be called before use")

    async def _send(self, message: dict[str, Any]) -> None:
        await self._transport.send(message)
        peer = message["to"] if message["to"] != "*" else "*"
        await self._audit_envelope(message, str(peer))

    async def _audit_record(self, event: AuditEvent) -> None:
        if self._audit is not None:
            self._audit.record(event)

    async def _audit_envelope(self, message: dict[str, Any], peer_id: str) -> None:
        msg_type = message.get("type")
        allowed = {
            "hello",
            "hello.ack",
            "capabilities.query",
            "capabilities.announce",
            "task.offer",
            "task.accept",
            "task.reject",
            "task.start",
            "task.progress",
            "task.result",
            "task.failed",
            "task.cancel",
            "event",
            "error",
        }
        if msg_type not in allowed:
            return
        payload = message.get("payload") or {}
        task_id = payload.get("taskId") if isinstance(payload, dict) else None
        await self._audit_record(
            AuditEvent(
                type=msg_type,  # type: ignore[arg-type]
                ts=now_iso(),
                agent_id=self.id,
                peer_id=peer_id,
                task_id=task_id,
                envelope=message,
            )
        )

    async def hello(self, to: AgentId | str = "*") -> None:
        self._ensure_started()
        await self._send(
            create_envelope(
                type="hello",
                from_agent=self.id,
                to=to,
                payload={"profile": self.profile},
            )
        )

    async def query_capabilities(
        self, to: AgentId, filt: list[str] | None = None
    ) -> list[Any]:
        self._ensure_started()
        remote = self._remotes.get(to)
        if remote and filt is None:
            return remote.capabilities

        loop = asyncio.get_running_loop()
        fut: asyncio.Future[list[Any]] = loop.create_future()
        query_payload: dict[str, Any] = {}
        if filt is not None:
            query_payload["filter"] = filt
        request = create_envelope(
            type="capabilities.query",
            from_agent=self.id,
            to=to,
            payload=query_payload,
            session_id=remote.session_id if remote else None,
        )

        def on_msg(message: dict[str, Any]) -> None:
            if (
                message.get("type") == "capabilities.announce"
                and message.get("from") == to
                and message.get("correlationId") == request["id"]
                and not fut.done()
            ):
                fut.set_result((message.get("payload") or {}).get("capabilities") or [])

        unsub = self._transport.subscribe(on_msg)

        async def _wait() -> list[Any]:
            try:
                await self._send(request)
                return await asyncio.wait_for(fut, timeout=5.0)
            finally:
                unsub()

        try:
            return await _wait()
        except TimeoutError as err:
            raise A2AError(
                "TIMEOUT", f"capabilities.query timed out for {to}", retryable=True
            ) from err

    async def offer_task(
        self,
        *,
        to: AgentId,
        goal: str,
        input: Any = None,
        required_capabilities: list[str] | None = None,
        timeout_ms: float | None = None,
        meta: dict[str, Any] | None = None,
        task_id: str | None = None,
        retries: int = 0,
    ) -> dict[str, Any]:
        self._ensure_started()
        if retries <= 0:
            return await self._offer_task_once(
                to=to,
                goal=goal,
                input=input,
                required_capabilities=required_capabilities,
                timeout_ms=timeout_ms,
                meta=meta,
                task_id=task_id,
            )

        async def attempt(_n: int) -> dict[str, Any]:
            outcome = await self._offer_task_once(
                to=to,
                goal=goal,
                input=input,
                required_capabilities=required_capabilities,
                timeout_ms=timeout_ms,
                meta=meta,
                task_id=create_id("task"),
            )
            if outcome.get("status") == "failed":
                err = outcome.get("error") or {}
                raise A2AError(
                    err.get("code", "INTERNAL"),
                    err.get("message", "failed"),
                    retryable=err.get("code") in {"TIMEOUT", "INTERNAL"},
                    task_id=err.get("taskId"),
                )
            return outcome

        try:
            return await with_retry(
                attempt,
                attempts=retries + 1,
                should_retry=lambda e, _a: isinstance(e, A2AError) and e.retryable,
            )
        except A2AError as err:
            return {
                "status": "failed",
                "error": {
                    "taskId": err.task_id or "unknown",
                    "code": err.code,
                    "message": str(err),
                },
            }

    async def _offer_task_once(
        self,
        *,
        to: AgentId,
        goal: str,
        input: Any,
        required_capabilities: list[str] | None,
        timeout_ms: float | None,
        meta: dict[str, Any] | None,
        task_id: str | None,
    ) -> dict[str, Any]:
        remote = self._remotes.get(to)
        tid = task_id or create_id("task")
        offer: dict[str, Any] = {"taskId": tid, "goal": goal}
        if input is not None:
            offer["input"] = input
        if required_capabilities:
            offer["requiredCapabilities"] = required_capabilities
        if timeout_ms is not None:
            offer["timeoutMs"] = timeout_ms
        if meta:
            offer["meta"] = meta

        if self._policy is not None and hasattr(self._policy, "before_offer"):
            decision: PolicyDecision = await self._policy.before_offer(
                from_agent=self.id, to=to, offer=offer
            )
            if not decision.get("allow", True):
                await self._audit_record(
                    AuditEvent(
                        type="policy.deny",
                        ts=now_iso(),
                        agent_id=self.id,
                        peer_id=to,
                        task_id=tid,
                        detail={"side": "offer", "reason": decision.get("reason")},
                    )
                )
                return {"status": "rejected", "reason": decision.get("reason", "denied")}

        loop = asyncio.get_running_loop()
        fut: asyncio.Future[dict[str, Any]] = loop.create_future()
        pending = _PendingOffer(future=fut)
        effective_timeout = timeout_ms if timeout_ms is not None else self._default_task_timeout_ms
        if effective_timeout is not None:

            def _timeout() -> None:
                self._pending.pop(tid, None)
                if not fut.done():
                    fut.set_result(
                        {
                            "status": "failed",
                            "error": {
                                "taskId": tid,
                                "code": "TIMEOUT",
                                "message": f"Task {tid} timed out after {effective_timeout}ms",
                            },
                        }
                    )

            pending.timer = loop.call_later(effective_timeout / 1000.0, _timeout)

        self._pending[tid] = pending
        try:
            await self._send(
                create_envelope(
                    type="task.offer",
                    from_agent=self.id,
                    to=to,
                    payload=offer,
                    session_id=remote.session_id if remote else None,
                )
            )
            return await fut
        except Exception:
            if pending.timer:
                pending.timer.cancel()
            self._pending.pop(tid, None)
            raise

    async def _handle_inbound(self, message: dict[str, Any]) -> None:
        if self._on_message:
            self._on_message(message)
        await self._audit_envelope(message, str(message.get("from")))

        if message.get("v") != PROTOCOL_VERSION:
            await self._send_error(
                message["from"],
                {
                    "code": "PROTOCOL_VERSION",
                    "message": f"Unsupported protocol version: {message.get('v')}",
                    "retryable": False,
                },
                message.get("id"),
            )
            return

        if message.get("to") not in {"*", self.id}:
            return

        msg_type = message.get("type")
        try:
            if msg_type == "hello":
                await self._on_hello(message)
            elif msg_type == "hello.ack":
                self._on_hello_ack(message)
            elif msg_type == "capabilities.query":
                await self._on_capabilities_query(message)
            elif msg_type == "capabilities.announce":
                self._on_capabilities_announce(message)
            elif msg_type == "task.offer":
                await self._on_task_offer(message)
            elif msg_type in {
                "task.accept",
                "task.reject",
                "task.start",
                "task.progress",
                "task.result",
                "task.failed",
                "event",
            }:
                self._on_task_lifecycle(message)
            elif msg_type == "task.cancel":
                self._on_task_cancel(message)
            elif msg_type == "ping":
                await self._on_ping(message)
            elif msg_type in {"pong", "error"}:
                return
            else:
                await self._send_error(
                    message["from"],
                    {
                        "code": "UNKNOWN_TYPE",
                        "message": f"Unknown message type: {msg_type}",
                        "retryable": False,
                    },
                    message.get("id"),
                )
        except Exception as err:  # noqa: BLE001
            payload = (
                err.to_payload()
                if isinstance(err, A2AError)
                else {
                    "code": "INTERNAL",
                    "message": str(err),
                    "retryable": False,
                }
            )
            await self._send_error(message["from"], payload, message.get("id"))

    async def _on_hello(self, message: dict[str, Any]) -> None:
        profile = (message.get("payload") or {}).get("profile")
        if not profile:
            return
        session_id = create_id("sess")
        self._remotes[profile["id"]] = RemotePeer(
            agent_id=profile["id"],
            profile=profile,
            session_id=session_id,
            capabilities=list(profile.get("capabilities") or []),
        )
        await self._send(
            create_envelope(
                type="hello.ack",
                from_agent=self.id,
                to=message["from"],
                payload={"profile": self.profile, "sessionId": session_id},
                correlation_id=message.get("id"),
                session_id=session_id,
            )
        )

    def _on_hello_ack(self, message: dict[str, Any]) -> None:
        payload = message.get("payload") or {}
        profile = payload.get("profile")
        session_id = payload.get("sessionId")
        if not profile or not session_id:
            return
        self._remotes[profile["id"]] = RemotePeer(
            agent_id=profile["id"],
            profile=profile,
            session_id=session_id,
            capabilities=list(profile.get("capabilities") or []),
        )

    async def _on_capabilities_query(self, message: dict[str, Any]) -> None:
        payload = message.get("payload") or {}
        caps = filter_capabilities(self.profile["capabilities"], payload.get("filter"))
        remote = self._remotes.get(message["from"])
        await self._send(
            create_envelope(
                type="capabilities.announce",
                from_agent=self.id,
                to=message["from"],
                payload={"capabilities": caps},
                correlation_id=message.get("id"),
                session_id=remote.session_id if remote else None,
            )
        )

    def _on_capabilities_announce(self, message: dict[str, Any]) -> None:
        existing = self._remotes.get(message["from"])
        if not existing:
            return
        caps = (message.get("payload") or {}).get("capabilities") or []
        existing.capabilities = caps
        existing.profile = {**existing.profile, "capabilities": caps}

    async def _on_task_offer(self, message: dict[str, Any]) -> None:
        offer = message.get("payload") or {}
        remote = self._remotes.get(message["from"])
        missing = missing_capabilities(
            self.profile["capabilities"], offer.get("requiredCapabilities")
        )
        if missing or not has_all_capabilities(
            self.profile["capabilities"], offer.get("requiredCapabilities")
        ):
            await self._send(
                create_envelope(
                    type="task.reject",
                    from_agent=self.id,
                    to=message["from"],
                    payload={
                        "taskId": offer.get("taskId"),
                        "reason": f"Missing capabilities: {', '.join(missing) or 'required'}",
                        "code": "CAPABILITY_MISMATCH",
                    },
                    correlation_id=message.get("id"),
                    session_id=remote.session_id if remote else None,
                )
            )
            return

        if self._policy is not None and hasattr(self._policy, "before_accept"):
            decision = await self._policy.before_accept(
                from_agent=message["from"],
                to=self.id,
                offer=offer,
                local_profile=self.profile,
            )
            if not decision.get("allow", True):
                await self._audit_record(
                    AuditEvent(
                        type="policy.deny",
                        ts=now_iso(),
                        agent_id=self.id,
                        peer_id=message["from"],
                        task_id=offer.get("taskId"),
                        detail={"side": "accept", "reason": decision.get("reason")},
                    )
                )
                await self._send(
                    create_envelope(
                        type="task.reject",
                        from_agent=self.id,
                        to=message["from"],
                        payload={
                            "taskId": offer.get("taskId"),
                            "reason": decision.get("reason", "denied"),
                            "code": "REJECTED",
                        },
                        correlation_id=message.get("id"),
                        session_id=remote.session_id if remote else None,
                    )
                )
                return

        handler = self._resolve_handler(offer.get("requiredCapabilities"))
        if handler is None:
            await self._send(
                create_envelope(
                    type="task.reject",
                    from_agent=self.id,
                    to=message["from"],
                    payload={
                        "taskId": offer.get("taskId"),
                        "reason": "No handler registered for offered task",
                        "code": "REJECTED",
                    },
                    correlation_id=message.get("id"),
                    session_id=remote.session_id if remote else None,
                )
            )
            return

        await self._send(
            create_envelope(
                type="task.accept",
                from_agent=self.id,
                to=message["from"],
                payload={"taskId": offer["taskId"], "message": "accepted"},
                correlation_id=message.get("id"),
                session_id=remote.session_id if remote else None,
            )
        )
        self._local_tasks[offer["taskId"]] = {"cancelled": False, "from": message["from"]}
        await self._send(
            create_envelope(
                type="task.start",
                from_agent=self.id,
                to=message["from"],
                payload={"taskId": offer["taskId"]},
                session_id=remote.session_id if remote else None,
            )
        )

        async def report(update: dict[str, Any]) -> None:
            await self._send(
                create_envelope(
                    type="task.progress",
                    from_agent=self.id,
                    to=message["from"],
                    payload=update,
                    session_id=remote.session_id if remote else None,
                )
            )

        async def emit(payload: dict[str, Any]) -> None:
            await self._send(
                create_envelope(
                    type="event",
                    from_agent=self.id,
                    to=message["from"],
                    payload=payload,
                    session_id=remote.session_id if remote else None,
                )
            )

        ctx = TaskContext(
            task_id=offer["taskId"],
            offer=offer,
            from_agent=message["from"],
            _report=report,
            _emit=emit,
            _is_cancelled=lambda: self._local_tasks.get(offer["taskId"], {}).get(
                "cancelled", False
            ),
        )

        try:
            output = await handler(ctx)
            if ctx.is_cancelled():
                return
            await self._send(
                create_envelope(
                    type="task.result",
                    from_agent=self.id,
                    to=message["from"],
                    payload={"taskId": offer["taskId"], "output": output},
                    session_id=remote.session_id if remote else None,
                )
            )
        except Exception as err:  # noqa: BLE001
            failed = {
                "taskId": offer["taskId"],
                "code": err.code if isinstance(err, A2AError) else "INTERNAL",
                "message": str(err),
            }
            await self._send(
                create_envelope(
                    type="task.failed",
                    from_agent=self.id,
                    to=message["from"],
                    payload=failed,
                    session_id=remote.session_id if remote else None,
                )
            )
        finally:
            self._local_tasks.pop(offer["taskId"], None)

    def _resolve_handler(self, required: list[str] | None) -> TaskHandler | None:
        if required:
            for name in required:
                if name in self._handlers:
                    return self._handlers[name]
        if self._handlers:
            return next(iter(self._handlers.values()))
        return self._default_handler

    def _on_task_lifecycle(self, message: dict[str, Any]) -> None:
        payload = message.get("payload") or {}
        task_id = payload.get("taskId")
        if not task_id:
            return
        pending = self._pending.get(task_id)
        if not pending:
            return
        msg_type = message.get("type")
        if msg_type == "task.reject":
            if pending.timer:
                pending.timer.cancel()
            self._pending.pop(task_id, None)
            if not pending.future.done():
                pending.future.set_result(
                    {"status": "rejected", "reason": payload.get("reason", "rejected")}
                )
        elif msg_type == "task.progress":
            pending.progress.append(payload)
        elif msg_type == "event":
            pending.events.append(payload)
        elif msg_type == "task.result":
            if pending.timer:
                pending.timer.cancel()
            self._pending.pop(task_id, None)
            if not pending.future.done():
                pending.future.set_result({"status": "completed", "result": payload})
        elif msg_type == "task.failed":
            if pending.timer:
                pending.timer.cancel()
            self._pending.pop(task_id, None)
            if not pending.future.done():
                pending.future.set_result({"status": "failed", "error": payload})

    def _on_task_cancel(self, message: dict[str, Any]) -> None:
        payload = message.get("payload") or {}
        local = self._local_tasks.get(payload.get("taskId", ""))
        if local:
            local["cancelled"] = True

    async def _on_ping(self, message: dict[str, Any]) -> None:
        remote = self._remotes.get(message["from"])
        await self._send(
            create_envelope(
                type="pong",
                from_agent=self.id,
                to=message["from"],
                payload=message.get("payload"),
                correlation_id=message.get("id"),
                session_id=remote.session_id if remote else None,
            )
        )

    async def _send_error(
        self, to: AgentId, payload: dict[str, Any], correlation_id: str | None
    ) -> None:
        remote = self._remotes.get(to)
        await self._send(
            create_envelope(
                type="error",
                from_agent=self.id,
                to=to,
                payload=payload,
                correlation_id=correlation_id,
                session_id=remote.session_id if remote else None,
            )
        )
