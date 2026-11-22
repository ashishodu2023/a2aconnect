from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

from a2aconnect import PROTOCOL_VERSION, __version__
from a2aconnect.bridge import LOCAL_TO_A2A, profile_to_agent_card_stub
from a2aconnect.gateway import AgentRegistry


def _find_root() -> Path:
    here = Path(__file__).resolve()
    for parent in [here.parents[i] for i in range(1, min(6, len(here.parents)))]:
        if (parent / "pyproject.toml").exists() and (parent / "demos").exists():
            return parent
    return Path.cwd()


ROOT = _find_root()


def cmd_version(_: argparse.Namespace) -> int:
    print(f"a2aconnect {__version__} (profile v{PROTOCOL_VERSION})")
    return 0


def cmd_doctor(_: argparse.Namespace) -> int:
    print("A2AConnect doctor")
    print(f"  version: {__version__}")
    print(f"  profile: {PROTOCOL_VERSION}")
    print(f"  python:  {sys.version.split()[0]}")
    demos = [
        "demos/quickstart.py",
        "demos/support_desk.py",
        "demos/incident_handoff.py",
        "demos/two_agents.py",
        "demos/registry_hub.py",
    ]
    for rel in demos:
        path = ROOT / rel
        print(f"  demo {'OK' if path.exists() else 'MISS'}: {rel}")
    print("  map:")
    for k, v in LOCAL_TO_A2A.items():
        print(f"    - {k} → {v}")
    return 0


def cmd_map(_: argparse.Namespace) -> int:
    print(json.dumps(LOCAL_TO_A2A, indent=2))
    return 0


def cmd_card(args: argparse.Namespace) -> int:
    profile = {
        "id": args.id,
        "name": args.name or args.id,
        "capabilities": [{"name": c} for c in (args.capability or [])],
    }
    print(json.dumps(profile_to_agent_card_stub(profile), indent=2))
    return 0


def cmd_registry_demo(_: argparse.Namespace) -> int:
    reg = AgentRegistry()
    reg.register(
        {"id": "researcher", "name": "Researcher", "capabilities": [{"name": "research.web"}]},
        endpoint="memory://researcher",
    )
    reg.register(
        {"id": "writer", "name": "Writer", "capabilities": [{"name": "write.brief"}]},
        endpoint="memory://writer",
    )
    hits = reg.find_by_capability("research.web")
    print(json.dumps([{"id": h.profile["id"], "endpoint": h.endpoint} for h in hits], indent=2))
    return 0


def cmd_demo(args: argparse.Namespace) -> int:
    mapping = {
        "quickstart": "demos/quickstart.py",
        "support": "demos/support_desk.py",
        "incident": "demos/incident_handoff.py",
        "two": "demos/two_agents.py",
        "registry": "demos/registry_hub.py",
    }
    rel = mapping[args.name]
    path = ROOT / rel
    if not path.exists():
        # installed wheel: run via import path under site — fall back to cwd
        path = Path.cwd() / rel
    if not path.exists():
        print(f"demo not found: {rel}", file=sys.stderr)
        return 1
    return subprocess.call([sys.executable, str(path)])


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="a2aconnect", description="A2AConnect CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("version", help="Print package + profile version")
    s.set_defaults(func=cmd_version)

    s = sub.add_parser("doctor", help="Environment + demo file check")
    s.set_defaults(func=cmd_doctor)

    s = sub.add_parser("map", help="Print local ↔ LF A2A conceptual map")
    s.set_defaults(func=cmd_map)

    s = sub.add_parser("card", help="Emit Agent Card stub from a profile")
    s.add_argument("--id", required=True)
    s.add_argument("--name")
    s.add_argument("--capability", action="append")
    s.set_defaults(func=cmd_card)

    s = sub.add_parser("registry", help="Tiny in-process registry demo")
    s.set_defaults(func=cmd_registry_demo)

    s = sub.add_parser("demo", help="Run a bundled demo script")
    s.add_argument("name", choices=["quickstart", "support", "incident", "two", "registry"])
    s.set_defaults(func=cmd_demo)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
