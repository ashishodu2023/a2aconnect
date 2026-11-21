from __future__ import annotations

from typing import Any

from a2aconnect.protocol.types import ErrorCode


class A2AError(Exception):
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        *,
        retryable: bool = False,
        details: Any = None,
        task_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.retryable = retryable
        self.details = details
        self.task_id = task_id

    def to_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "code": self.code,
            "message": str(self),
            "retryable": self.retryable,
        }
        if self.details is not None:
            payload["details"] = self.details
        if self.task_id is not None:
            payload["taskId"] = self.task_id
        return payload


def error_payload(
    code: ErrorCode,
    message: str,
    *,
    retryable: bool = False,
    details: Any = None,
    task_id: str | None = None,
) -> dict[str, Any]:
    return A2AError(
        code, message, retryable=retryable, details=details, task_id=task_id
    ).to_payload()
