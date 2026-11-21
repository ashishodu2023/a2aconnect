export interface RetryOptions {
  /** Max attempts including the first try. Default 3. */
  attempts?: number;
  /** Initial delay in ms. Default 50. */
  initialDelayMs?: number;
  /** Multiplier per attempt. Default 2. */
  factor?: number;
  /** Cap delay. Default 2000. */
  maxDelayMs?: number;
  /** Return false to stop retrying. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  signal?: AbortSignal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error("aborted"));
      },
      { once: true },
    );
  });
}

/**
 * Generic async retry with exponential backoff — used for transport sends
 * and offerTask retries when peers are temporarily unavailable.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 50;
  const factor = options.factor ?? 2;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt >= attempts || !shouldRetry(err, attempt)) {
        throw err;
      }
      const delay = Math.min(initialDelayMs * factor ** (attempt - 1), maxDelayMs);
      await sleep(delay, options.signal);
    }
  }
  throw lastError;
}
