import type { ChatMessage, ModelClient } from '../src/lib/model';
import type { StartupProfile } from '../src/lib/schemas';

// Scripted fake model. Each call consumes the next scripted reply; the last reply repeats.
// Errors in the script are thrown, which simulates transport failures.
export function fakeModel(script: Array<string | Error>) {
  const calls: ChatMessage[][] = [];
  let i = 0;
  const model: ModelClient & { calls: ChatMessage[][] } = {
    calls,
    async complete(messages) {
      calls.push(messages);
      const next = script[Math.min(i++, script.length - 1)];
      if (next instanceof Error) throw next;
      return next;
    },
  };
  return model;
}

// The golden-path founder, from the handover's AgriSmart walkthrough.
export const agriSmart: StartupProfile = {
  startup_name: 'AgriSmart',
  description: 'AI leaf disease detection on phones for smallholder farms.',
  industry: 'AgriTech',
  home_country: 'Malaysia',
  target_country: 'Indonesia',
  stage: 'Seed',
  product: 'Phone-based leaf disease detection',
  primary_goal: 'Pilot Partnership',
  needs: ['Field pilot'],
  capability_tags: ['crop disease detection', 'mobile workflow'],
};

let ipCounter = 0;
// Unique IP per request so the in-memory AI rate limiter never affects unrelated tests.
export function jsonRequest(url: string, body?: unknown): Request {
  return new Request(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': `10.0.0.${++ipCounter}`,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}
