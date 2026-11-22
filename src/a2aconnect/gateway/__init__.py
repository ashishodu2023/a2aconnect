"""Gateway tier primitives (OSS in-process preview of hosted Gateway).

Surfaces:
  - Hosted auth & registry — HostedAuthStore, AgentRegistry
  - Edge routing & quotas — EdgeRouter, QuotaLedger, TokenBucket
  - Hosted audit retention — HostedAuditRetention
"""

from a2aconnect.gateway.auth import AuthResult, HostedAuthStore, StaticTokenGate, TenantCredential
from a2aconnect.gateway.quotas import QuotaLedger, QuotaStatus
from a2aconnect.gateway.rate_limit import TokenBucket
from a2aconnect.gateway.registry import AgentRegistry, RegisteredAgent
from a2aconnect.gateway.retention import HostedAuditRetention, RetentionPolicy
from a2aconnect.gateway.routing import EdgeRouter, RouteDecision

__all__ = [
    "AgentRegistry",
    "AuthResult",
    "EdgeRouter",
    "HostedAuditRetention",
    "HostedAuthStore",
    "QuotaLedger",
    "QuotaStatus",
    "RegisteredAgent",
    "RetentionPolicy",
    "RouteDecision",
    "StaticTokenGate",
    "TenantCredential",
    "TokenBucket",
]
