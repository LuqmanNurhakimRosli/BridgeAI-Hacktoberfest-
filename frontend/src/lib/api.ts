import { AppError, errorResponse } from './errors';

const MAX_BODY_CHARS = 16_384;

export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) throw new AppError('VALIDATION_ERROR', 'Request body is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON.');
  }
}

// Best-effort per-IP limiter for AI routes. In-memory, so it resets on cold start.
// The real safety net is the OpenRouter account spend cap.
const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 20;
const MAX_TRACKED_IPS = 5_000;
const hits = new Map<string, number[]>();

// Use headers the hosting proxy sets. The left-most x-forwarded-for entry is client-supplied
// and spoofable, so fall back to the right-most one (appended by the trusted proxy).
function clientIp(req: Request): string {
  const h = req.headers;
  const forwarded = h.get('x-forwarded-for')?.split(',').pop()?.trim();
  return h.get('x-vercel-forwarded-for')?.trim() || h.get('x-real-ip')?.trim() || forwarded || 'unknown';
}

export function guardAi(req: Request, now = Date.now()): void {
  if (hits.size >= MAX_TRACKED_IPS) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
    if (hits.size >= MAX_TRACKED_IPS) hits.clear();
  }
  const ip = clientIp(req);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT_PER_WINDOW) {
    throw new AppError('RATE_LIMITED', 'Too many requests. Try again in a minute.', '60');
  }
  recent.push(now);
  hits.set(ip, recent);
}

type Handler = (req: Request) => Promise<Response>;

// Wraps a handler so every error becomes the standard envelope. Route files use this.
export function route(handler: Handler, opts: { ai?: boolean } = {}): Handler {
  return async (req) => {
    try {
      if (opts.ai) guardAi(req);
      return await handler(req);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
