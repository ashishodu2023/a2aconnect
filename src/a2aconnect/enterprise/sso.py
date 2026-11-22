from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SsoAssertion:
    """Normalized SSO assertion after IdP login (Enterprise preview)."""

    subject: str
    email: str
    tenant_id: str
    groups: list[str] = field(default_factory=list)
    attributes: dict[str, Any] = field(default_factory=dict)


@dataclass
class SsoSession:
    session_id: str
    assertion: SsoAssertion
    issued_at: float
    expires_at: float


class SsoSessionStore:
    """In-process SSO session store (Enterprise preview).

    Accepts assertions (as if issued by Okta/Azure AD/SAML), mints sessions,
    and validates them for gateway handoffs. Hosted Enterprise wires a real IdP.
    """

    def __init__(self, *, ttl_sec: float = 3600) -> None:
        self.ttl_sec = ttl_sec
        self._sessions: dict[str, SsoSession] = {}

    def login(self, assertion: SsoAssertion) -> SsoSession:
        now = time.time()
        session = SsoSession(
            session_id=secrets.token_urlsafe(24),
            assertion=assertion,
            issued_at=now,
            expires_at=now + self.ttl_sec,
        )
        self._sessions[session.session_id] = session
        return session

    def validate(self, session_id: str | None) -> SsoSession | None:
        if not session_id:
            return None
        session = self._sessions.get(session_id)
        if session is None:
            return None
        if time.time() > session.expires_at:
            self._sessions.pop(session_id, None)
            return None
        return session

    def logout(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
