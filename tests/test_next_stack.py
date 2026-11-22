import asyncio
import json
import urllib.request

import pytest

from a2aconnect import (
    HttpPeerServer,
    LfA2AWireAdapter,
    MemorySpanExporter,
    OtlpJsonExporter,
    create_envelope,
)


@pytest.mark.asyncio
async def test_http_peer_server_roundtrip():
    server = HttpPeerServer(host="127.0.0.1", port=0)
    await server.start()
    try:
        env = create_envelope(type="hello", from_agent="a", to="b", payload={"ping": True})
        data = json.dumps(env).encode("utf-8")
        req = urllib.request.Request(
            f"{server.base_url}/v1/envelope",
            data=data,
            headers={"content-type": "application/json"},
            method="POST",
        )

        def _post() -> int:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return int(resp.status)

        assert await asyncio.to_thread(_post) == 202
        await asyncio.sleep(0.05)
        msgs = server.drain("b")
        assert len(msgs) == 1
        assert msgs[0]["type"] == "hello"

        def _health() -> dict:
            with urllib.request.urlopen(f"{server.base_url}/healthz", timeout=5) as resp:
                return json.loads(resp.read().decode())

        assert (await asyncio.to_thread(_health))["ok"] is True
    finally:
        await server.stop()


def test_lf_a2a_wire_adapter_roundtrip():
    bridge = LfA2AWireAdapter()
    env = create_envelope(
        type="task.offer",
        from_agent="hub",
        to="worker",
        payload={"goal": "x"},
        correlation_id="c1",
    )
    a2a = bridge.to_a2a(env)
    assert a2a["method"] == "tasks/send"
    assert a2a["params"]["status"]["state"] == "submitted"
    back = bridge.from_a2a(a2a)
    assert back["type"] == "task.offer"
    assert back["from"] == "hub"
    assert back["to"] == "worker"


def test_otlp_memory_exporter():
    spans = MemorySpanExporter()
    root = spans.start_span("root", attributes={"k": "v"})
    child = spans.start_span("child", parent=root)
    spans.end_span(child)
    spans.end_span(root)
    payload = spans.to_otlp_json()
    exported = OtlpJsonExporter().export(spans)
    assert exported["ok"] and exported["mode"] == "memory"
    assert len(payload["resourceSpans"][0]["scopeSpans"][0]["spans"]) == 2
