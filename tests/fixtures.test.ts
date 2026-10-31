import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildFixtures } from '../scripts/generate-fixtures';
import { analyzeResponseSchema, matchesResponseSchema, pocResponseSchema, errorEnvelopeSchema } from '../src/lib/contract';

const load = (name: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../src/lib/ai/fixtures/${name}`, import.meta.url)), 'utf8'));

describe('frontend fixtures', () => {
  it('match the public response contract', () => {
    expect(() => analyzeResponseSchema.parse(load('analyze-agrismart.json'))).not.toThrow();
    expect(() => matchesResponseSchema.parse(load('matches-agrismart.json'))).not.toThrow();
    expect(() => pocResponseSchema.parse(load('poc-agrismart.json'))).not.toThrow();
  });

  it('keep the incomplete passport honest: unknowns stay null and are listed as missing', () => {
    const { profile } = analyzeResponseSchema.parse(load('analyze-incomplete.json'));
    expect(profile.stage).toBeNull();
    expect(profile.primary_goal).toBeNull();
    expect(profile.missing_fields).toEqual(expect.arrayContaining(['stage', 'target_country', 'primary_goal', 'industry']));
  });

  it('label every AI response as a fixture, so the UI never shows the Gemma badge for canned data', () => {
    for (const name of ['analyze-agrismart.json', 'analyze-incomplete.json', 'matches-agrismart.json', 'poc-agrismart.json']) {
      expect(load(name).meta.source, name).toBe('fixture');
    }
  });

  it('use the standard error envelope for every documented error', () => {
    const errors = load('errors.json') as Record<string, { status: number; body: unknown }>;
    expect(Object.keys(errors).sort()).toEqual(
      ['ai_unavailable', 'invalid_model_output', 'profile_incomplete', 'rate_limited', 'unknown_demand', 'validation_error'],
    );
    for (const [name, e] of Object.entries(errors)) expect(() => errorEnvelopeSchema.parse(e.body), name).not.toThrow();
  });

  it('are up to date with the real handlers (run `npm run fixtures` if this fails)', async () => {
    const built = await buildFixtures();
    for (const [name, data] of Object.entries(built)) {
      expect(load(name), name).toEqual(JSON.parse(JSON.stringify(data)));
    }
  });
});
