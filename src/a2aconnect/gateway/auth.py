from __future__ import annotations

from dataclasses import dataclass


@dataclass
class StaticTokenGate:
    """Simple shared-secret gate for local Gateway demos."""

    token: str

    def allow(self, presented: str | None) -> bool:
        return bool(presented) and presented == self.token
