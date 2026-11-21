import type { ErrorCode, ErrorPayload } from "./types.js";

export class A2AError extends Error {
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly details?: unknown;
  readonly taskId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { retryable?: boolean; details?: unknown; taskId?: string },
  ) {
    super(message);
    this.name = "A2AError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    if (options?.details !== undefined) this.details = options.details;
    if (options?.taskId !== undefined) this.taskId = options.taskId;
  }

  toPayload(): ErrorPayload {
    const payload: ErrorPayload = {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
    if (this.details !== undefined) payload.details = this.details;
    if (this.taskId !== undefined) payload.taskId = this.taskId;
    return payload;
  }
}

export function errorPayload(
  code: ErrorCode,
  message: string,
  options?: { retryable?: boolean; details?: unknown; taskId?: string },
): ErrorPayload {
  return new A2AError(code, message, options).toPayload();
}
