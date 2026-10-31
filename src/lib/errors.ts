import { ZodError } from 'zod';

export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNKNOWN_DEMAND: 404,
  PROFILE_INCOMPLETE: 422,
  TRACK_NOT_SUPPORTED: 422,
  INVALID_TRANSITION: 422,
  DUPLICATE_EVENT: 409,
  RATE_LIMITED: 429,
  UPSTREAM_RATE_LIMIT: 429,
  AI_UNAVAILABLE: 503,
  INVALID_MODEL_OUTPUT: 502,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly retryAfter?: string,
  ) {
    super(message);
    this.status = ERROR_STATUS[code];
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status, headers: err.retryAfter ? { 'Retry-After': err.retryAfter } : undefined },
    );
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const path = issue?.path.join('.') || 'body';
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: `${path}: ${issue?.message ?? 'invalid'}` } },
      { status: 400 },
    );
  }
  // Log the error type only: never the request body, prompts or model output.
  console.error('unhandled error:', err instanceof Error ? err.name : 'unknown');
  return Response.json({ error: { code: 'INTERNAL', message: 'Unexpected server error.' } }, { status: 500 });
}
