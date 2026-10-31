// Stable AI error codes shared with the API layer (see handover section 10.5).

export type AiErrorCode =
  | 'VALIDATION_ERROR'      // caller input rejected before any model call
  | 'AI_NOT_CONFIGURED'     // no API key on the server
  | 'AI_AUTH_FAILED'        // 401: key invalid or expired
  | 'AI_INSUFFICIENT_CREDITS' // 402
  | 'UPSTREAM_RATE_LIMIT'   // 429
  | 'AI_MODEL_UNSUPPORTED'  // 404: provider does not support a requested parameter
  | 'AI_UNAVAILABLE'        // timeout, 5xx, network error after retry
  | 'INVALID_MODEL_OUTPUT'; // JSON or schema invalid after repair

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(code: AiErrorCode, message: string, status = 502, retryAfterSec?: number) {
    // Messages are safe to show to users: they never contain the key or prompt text.
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

export function toPublicError(err: unknown): { error: { code: string; message: string } } {
  if (err instanceof AiError) {
    return { error: { code: err.code, message: err.message } };
  }
  return { error: { code: 'AI_UNAVAILABLE', message: 'The AI service is unavailable. Please try again.' } };
}
