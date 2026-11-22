from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class StaticTokenGate:
    """Shared-secret gate for local Gateway demos."""

    token: str

    def allow(self, presented: str | None) -> bool:
        return bool(presented) and presented == self.token


@dataclass
class TenantCredential:
    """API credential bound to a tenant (hosted-auth preview)."""

    token: str
    tenant_id: str
    roles: list[str] = field(default_factory=lambda: ["agent"])
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class AuthResult:
    ok: bool
    tenant_id: str | None = None
    roles: list[str] = field(default_factory=list)
    reason: str | None = None


class HostedAuthStore:
    """In-process hosted auth preview — multi-tenant API tokens.

    Commercial Gateway hosts this centrally; OSS runs it in-process so fleets
    can practice auth + registry together.
    """

    def __init__(self) -> None:
        self._by_token: dict[str, TenantCredential] = {}

    def issue(
        self,
        *,
        token: str,
        tenant_id: str,
        roles: list[str] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> TenantCredential:
        cred = TenantCredential(
            token=token,
            tenant_id=tenant_id,
            roles=list(roles or ["agent"]),
            meta=dict(meta or {}),
        )
        self._by_token[token] = cred
        return cred

    def revoke(self, token: str) -> None:
        self._by_token.pop(token, None)

    def authenticate(self, presented: str | None) -> AuthResult:
        if not presented:
            return AuthResult(ok=False, reason="missing_token")
        cred = self._by_token.get(presented)
        if cred is None:
            return AuthResult(ok=False, reason="invalid_token")
        return AuthResult(ok=True, tenant_id=cred.tenant_id, roles=list(cred.roles))

    def require_role(self, presented: str | None, role: str) -> AuthResult:
        result = self.authenticate(presented)
        if not result.ok:
            return result
        if role not in result.roles:
            return AuthResult(
                ok=False,
                tenant_id=result.tenant_id,
                roles=result.roles,
                reason="forbidden",
            )
        return result
