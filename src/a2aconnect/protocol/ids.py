from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4


def create_id(prefix: str | None = None) -> str:
    uid = str(uuid4())
    return f"{prefix}_{uid}" if prefix else uid


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
