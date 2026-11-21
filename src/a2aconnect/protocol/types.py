from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict

PROTOCOL_VERSION = "1.0"

AgentId = str
MessageId = str
TaskId = str
SessionId = str

MessageType = Literal[
    "hello",
    "hello.ack",
    "capabilities.query",
    "capabilities.announce",
    "task.offer",
    "task.accept",
    "task.reject",
    "task.start",
    "task.progress",
    "task.result",
    "task.cancel",
    "task.failed",
    "event",
    "error",
    "ping",
    "pong",
]

ErrorCode = Literal[
    "PROTOCOL_VERSION",
    "UNKNOWN_TYPE",
    "CAPABILITY_MISMATCH",
    "TASK_NOT_FOUND",
    "TIMEOUT",
    "REJECTED",
    "INTERNAL",
    "INVALID_PAYLOAD",
]


class AgentCapability(TypedDict):
    name: str
    version: NotRequired[str]
    description: NotRequired[str]
    meta: NotRequired[dict[str, Any]]


class AgentProfile(TypedDict):
    id: AgentId
    name: str
    capabilities: list[AgentCapability]
    version: NotRequired[str]
    description: NotRequired[str]


class A2AEnvelope(TypedDict):
    v: str
    id: MessageId
    type: MessageType
    from_: AgentId  # serialized as "from"
    to: AgentId | Literal["*"]
    ts: str
    payload: Any
    correlationId: NotRequired[MessageId]
    sessionId: NotRequired[SessionId]
