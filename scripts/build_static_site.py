#!/usr/bin/env python3
"""Render the FastAPI Jinja templates to a static site (optional backup).

Primary site is Next.js in apps/web. This script builds a static mirror from
apps/web_python_fastapi templates into apps/web_python_fastapi/dist/.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web_python_fastapi"
DIST = WEB / "dist"
CANONICAL = "https://a2aconnect.dev"

sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

from apps.web_python_fastapi.app import INSTALL, QUICKSTART  # noqa: E402


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    shutil.copytree(WEB / "static", DIST / "static")

    env = Environment(
        loader=FileSystemLoader(str(WEB / "templates")),
        autoescape=select_autoescape(["html", "xml"]),
    )

    pages = {
        "index.html": (
            "home.html",
            {
                "title": "A2AConnect — Agent interop runtime",
                "canonical": f"{CANONICAL}/",
                "canonical_origin": CANONICAL,
                "quickstart": QUICKSTART,
                "install": INSTALL,
            },
        ),
        "architecture/index.html": (
            "architecture.html",
            {
                "title": "Architecture · A2AConnect",
                "canonical": f"{CANONICAL}/architecture",
                "canonical_origin": CANONICAL,
            },
        ),
        "examples/index.html": (
            "examples.html",
            {
                "title": "Examples · A2AConnect",
                "canonical": f"{CANONICAL}/examples",
                "canonical_origin": CANONICAL,
            },
        ),
    }

    for out_name, (template_name, ctx) in pages.items():
        out_path = DIST / out_name
        out_path.parent.mkdir(parents=True, exist_ok=True)
        html = env.get_template(template_name).render(**ctx)
        out_path.write_text(html, encoding="utf-8")

    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {CANONICAL}/sitemap.xml\n",
        encoding="utf-8",
    )
    (DIST / "sitemap.xml").write_text(
        "\n".join(
            [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                f"  <url><loc>{CANONICAL}/</loc></url>",
                f"  <url><loc>{CANONICAL}/architecture</loc></url>",
                f"  <url><loc>{CANONICAL}/examples</loc></url>",
                "</urlset>",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(f"Static site written to {DIST}")


if __name__ == "__main__":
    main()
