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

// The left-most x-forwarded-for entry is client-supplied and spoofable. Only trust the
// Vercel header when actually running on Vercel; otherwise use the right-most XFF entry,
// which is the one appended by our own proxy.
function clientIp(req: Request): string {
  const h = req.headers;
  const lastForwarded = h.get('x-forwarded-for')?.split(',').pop()?.trim();
  const platformIp = process.env.VERCEL ? h.get('x-vercel-forwarded-for')?.trim() : undefined;
  return platformIp || lastForwarded || 'unknown';
}

export function guardAi(req: Request, now = Date.now()): void {
  const ip = clientIp(req);
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT_PER_WINDOW) {
    throw new AppError('RATE_LIMITED', 'Too many requests. Try again in a minute.', '60');
  }
  recent.push(now);
  // Re-insert so Map order tracks recency, then evict the least recently seen IP when full.
  hits.delete(ip);
  hits.set(ip, recent);
  if (hits.size > MAX_TRACKED_IPS) hits.delete(hits.keys().next().value as string);
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
