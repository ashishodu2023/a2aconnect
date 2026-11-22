#!/usr/bin/env python3
"""Next stack preview: HTTP peer server + LF A2A wire bridge + OTLP spans.

Run: python demos/next_stack.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from a2aconnect import (  # noqa: E402
    HttpPeerServer,
    LfA2AWireAdapter,
    MemorySpanExporter,
    OtlpJsonExporter,
    create_envelope,
)


async def main() -> None:
    print("\n=== A2AConnect — Next stack preview ===\n")

    # 1) Multi-host HTTP peer server
    server = HttpPeerServer(host="127.0.0.1", port=0)
    await server.start()
    print(f"1) HTTP peer server listening at {server.base_url}")

    offer = create_envelope(
        type="task.offer",
        from_agent="hub",
        to="worker",
        payload={"goal": "Summarize note", "input": {"text": "interop next stack"}},
    )
    # Deliver via HTTP POST
    import urllib.request

    req = urllib.request.Request(
        f"{server.base_url}/v1/envelope",
        data=json.dumps(offer).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )

    def _post() -> int:
        with urllib.request.urlopen(req, timeout=5) as resp:  # noqa: S310
            return int(resp.status)

    status = await asyncio.to_thread(_post)
    print("   POST /v1/envelope →", status)
    await asyncio.sleep(0.05)
    polled = server.drain("worker")
    print(f"   polled {len(polled)} envelope(s) for worker")

    # 2) On-wire LF A2A bridge
    bridge = LfA2AWireAdapter()
    a2a_doc = bridge.to_a2a(offer)
    roundtrip = bridge.from_a2a(a2a_doc)
    print("2) LF A2A wire round-trip type:", roundtrip.get("type"), "method:", a2a_doc.get("method"))
    card = bridge.agent_card(
        {"id": "worker", "name": "Worker", "capabilities": [{"name": "text.summarize"}]},
        url=server.base_url,
    )
    print("   Agent Card url:", card.get("url"), "status:", card["a2aconnect"]["status"])

    # 3) OTLP / observability
    spans = MemorySpanExporter()
    root = spans.start_span("a2aconnect.handoff", attributes={"peer.to": "worker"})
    child = spans.start_span("a2aconnect.offer", parent=root, attributes={"msg.type": "task.offer"})
    spans.end_span(child, status="OK")
    spans.end_span(root, status="OK", attributes={"result": "accepted"})
    exporter = OtlpJsonExporter(endpoint=None)
    result = exporter.export(spans)
    print("3) OTLP export:", result, "payload spans:", len(exporter.sent[0]["resourceSpans"][0]["scopeSpans"][0]["spans"]))

    await server.stop()
    print("\n=== next_stack ok ===\n")


if __name__ == "__main__":
    asyncio.run(main())
