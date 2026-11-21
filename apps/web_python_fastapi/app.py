"""A2AConnect marketing site — FastAPI backup (Jinja).

Primary production site is Next.js in apps/web.

Local:
  pip install -e ".[web]"
  python3 apps/web_python_fastapi/app.py
  # → http://127.0.0.1:4318

Production:
  uvicorn apps.web_python_fastapi.app:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware

ROOT = Path(__file__).resolve().parent
CANONICAL_ORIGIN = os.environ.get("A2ACONNECT_ORIGIN", "https://a2aconnect.dev").rstrip("/")

templates = Jinja2Templates(directory=str(ROOT / "templates"))

app = FastAPI(title="A2AConnect", version="0.1.0", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")

QUICKSTART = '''import asyncio, json
from a2aconnect import AgentPeer, MemoryAuditLog, create_bus
from a2aconnect.adapters import from_async_fn

async def research_run(input, ctx):
    topic = (input or {}).get("topic", ctx.offer["goal"])
    await ctx.report_progress(percent=40, message=f"Researching {topic}")
    return {
        "topic": topic,
        "findings": [
            f"{topic}: fleets need a shared handoff layer",
            "LF A2A is the wire standard; A2AConnect is the runtime",
        ],
    }

bus = create_bus()
researcher = AgentPeer(
    profile={"id": "researcher", "name": "Researcher",
             "capabilities": [{"name": "research.web", "version": "1"}]},
    transport=bus.create_transport("researcher"),
    handlers={"research.web": from_async_fn(research_run)},
)
orchestrator = AgentPeer(
    profile={"id": "orchestrator", "name": "Orchestrator", "capabilities": []},
    transport=bus.create_transport("orchestrator"),
)
researcher.start(); orchestrator.start()
await orchestrator.hello("researcher")
outcome = await orchestrator.offer_task(
    to="researcher",
    goal="Research agent interop",
    input={"topic": "agent interop runtimes"},
    required_capabilities=["research.web"],
)
# full file: demos/quickstart.py'''

INSTALL = """pip install -e ".[dev]"
pytest
python demos/quickstart.py
python demos/two_agents.py
cd apps/web && npm run dev   # http://127.0.0.1:4783"""


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        return response


app.add_middleware(SecurityHeadersMiddleware)


def _ctx(path: str, title: str, **extra):
    return {
        "title": title,
        "canonical": f"{CANONICAL_ORIGIN}{path}",
        "canonical_origin": CANONICAL_ORIGIN,
        **extra,
    }


@app.get("/healthz", response_class=PlainTextResponse)
async def healthz() -> str:
    return "ok"


@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots() -> str:
    return f"""User-agent: *
Allow: /

Sitemap: {CANONICAL_ORIGIN}/sitemap.xml
"""


@app.get("/sitemap.xml")
async def sitemap() -> Response:
    urls = ["/", "/architecture", "/examples"]
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in urls:
        body.append("  <url>")
        body.append(f"    <loc>{CANONICAL_ORIGIN}{path if path != '/' else ''}</loc>")
        body.append("  </url>")
    body.append("</urlset>")
    return Response("\n".join(body) + "\n", media_type="application/xml")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "home.html",
        _ctx(
            "/",
            "A2AConnect — Agent interop runtime",
            quickstart=QUICKSTART,
            install=INSTALL,
        ),
    )


@app.get("/architecture", response_class=HTMLResponse)
async def architecture(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "architecture.html",
        _ctx("/architecture", "Architecture · A2AConnect"),
    )


@app.get("/examples", response_class=HTMLResponse)
async def examples(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "examples.html",
        _ctx("/examples", "Examples · A2AConnect"),
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "4318"))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
