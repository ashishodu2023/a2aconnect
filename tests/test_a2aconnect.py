from __future__ import annotations

import asyncio

import pytest

from a2aconnect import (
    PROTOCOL_VERSION,
    AgentPeer,
    HttpJsonTransport,
    MemoryAuditLog,
    create_bus,
    has_all_capabilities,
    missing_capabilities,
    reset_http_json_stubs,
    with_outbound_buffer,
    with_retry,
)


def profile(agent_id: str, caps: list[str]):
    return {
        "id": agent_id,
        "name": agent_id,
        "capabilities": [{"name": c} for c in caps],
    }


async def echo_handler(ctx):
    await ctx.report_progress(percent=50, message="working")
    await ctx.emit_event(name="tick", data=1)
    return {"echo": ctx.offer.get("input")}


async def ok_handler(ctx):
    return {"ok": True}


@pytest.mark.asyncio
async def test_capability_matching():
    available = [{"name": "research.web"}]
    assert has_all_capabilities(available, ["research.web"])
    assert not has_all_capabilities(available, ["write.brief"])
    assert missing_capabilities(available, ["write.brief", "research.web"]) == [
        "write.brief"
    ]


@pytest.mark.asyncio
async def test_with_retry():
    n = 0

    async def flaky(attempt: int):
        nonlocal n
        n += 1
        if n < 3:
            raise RuntimeError("transient")
        return "ok"

    assert await with_retry(flaky, attempts=5, initial_delay_ms=1) == "ok"
    assert n == 3


@pytest.mark.asyncio
async def test_handshake_and_task():
    bus = create_bus()
    worker = AgentPeer(
        profile=profile("worker", ["echo"]),
        transport=with_outbound_buffer(bus.create_transport("worker")),
        handlers={"echo": echo_handler},
    )
    client = AgentPeer(
        profile=profile("client", []),
        transport=bus.create_transport("client"),
    )
    worker.start()
    client.start()
    await client.hello("worker")
    await asyncio.sleep(0.02)
    assert client.get_remote("worker") is not None
    outcome = await client.offer_task(
        to="worker",
        goal="Echo",
        input={"hello": "world"},
        required_capabilities=["echo"],
        timeout_ms=5000,
    )
    assert outcome["status"] == "completed"
    assert outcome["result"]["output"] == {"echo": {"hello": "world"}}
    await client.stop()
    await worker.stop()
    await bus.close()


@pytest.mark.asyncio
async def test_capability_reject():
    bus = create_bus()
    worker = AgentPeer(
        profile=profile("worker", ["echo"]),
        transport=bus.create_transport("worker"),
        handlers={"echo": ok_handler},
    )
    client = AgentPeer(
        profile=profile("client", []), transport=bus.create_transport("client")
    )
    worker.start()
    client.start()
    await client.hello("worker")
    await asyncio.sleep(0.02)
    outcome = await client.offer_task(
        to="worker",
        goal="Nope",
        required_capabilities=["write.brief"],
        timeout_ms=5000,
    )
    assert outcome["status"] == "rejected"
    assert "write.brief" in outcome["reason"]
    await client.stop()
    await worker.stop()
    await bus.close()


@pytest.mark.asyncio
async def test_policy_and_audit():
    bus = create_bus()
    audit = MemoryAuditLog()

    class DenyWorker:
        async def before_offer(self, *, from_agent, to, offer):
            if to == "worker":
                return {"allow": False, "reason": "maintenance window"}
            return {"allow": True}

    worker = AgentPeer(
        profile=profile("worker", ["echo"]),
        transport=bus.create_transport("worker"),
        handlers={"echo": ok_handler},
    )
    client = AgentPeer(
        profile=profile("client", []),
        transport=bus.create_transport("client"),
        audit=audit,
        policy=DenyWorker(),
    )
    worker.start()
    client.start()
    await client.hello("worker")
    await asyncio.sleep(0.02)
    denied = await client.offer_task(
        to="worker",
        goal="denied",
        required_capabilities=["echo"],
        timeout_ms=2000,
    )
    assert denied["status"] == "rejected"
    assert "maintenance" in denied["reason"]
    assert any(e.type == "policy.deny" for e in audit.events)
    assert any(e.type == "hello" for e in audit.events)
    await client.stop()
    await worker.stop()
    await bus.close()


@pytest.mark.asyncio
async def test_http_stub():
    reset_http_json_stubs()
    worker = AgentPeer(
        profile=profile("http-worker", ["echo"]),
        transport=HttpJsonTransport(
            endpoint="http://stub/http-worker", stub=True, agent_id="http-worker"
        ),
        handlers={"echo": echo_handler},
    )
    client = AgentPeer(
        profile=profile("http-client", []),
        transport=HttpJsonTransport(
            endpoint="http://stub/http-client", stub=True, agent_id="http-client"
        ),
    )
    worker.start()
    client.start()
    await client.hello("http-worker")
    await asyncio.sleep(0.03)
    outcome = await client.offer_task(
        to="http-worker",
        goal="echo",
        input={"n": 1},
        required_capabilities=["echo"],
        timeout_ms=5000,
    )
    assert outcome["status"] == "completed"
    assert outcome["result"]["output"] == {"echo": {"n": 1}}
    await client.stop()
    await worker.stop()
    reset_http_json_stubs()


@pytest.mark.asyncio
async def test_protocol_version_on_hello():
    bus = create_bus()
    seen: list[str] = []
    a = AgentPeer(
        profile=profile("a", []),
        transport=bus.create_transport("a"),
        on_message=lambda m: seen.append(m["v"]),
    )
    b = AgentPeer(profile=profile("b", []), transport=bus.create_transport("b"))
    a.start()
    b.start()
    await a.hello("b")
    await asyncio.sleep(0.02)
    assert seen and all(v == PROTOCOL_VERSION for v in seen)
    await a.stop()
    await b.stop()
    await bus.close()
