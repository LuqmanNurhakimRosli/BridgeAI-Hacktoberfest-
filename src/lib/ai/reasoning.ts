// Prompt H — grounded reverse-match explanation.
// Gemma explains supplied candidates; it never changes scores, order, IDs or eligibility.

import { z } from 'zod';
import { AiError } from './errors';
import { runTask, type TaskDeps } from './task';
import { demandMatchPrompt, reasoningPrompt, PROMPT_VERSIONS } from './prompt-templates';
import { DemandExplanationsSchema, MatchExplanationSchema, type DemandExplanation, type MatchExplanation } from './schemas';
import { groundDemandExplanations, groundExplanations, newReport, sanitizeStrings, type GuardReport } from './postvalidate';

export const MAX_CANDIDATES = 5;

// P0 direction: one confirmed startup profile against several demand records the backend already scored.
// Gemma explains; scores, order, withheld lists and eligibility stay with the caller.
export async function explainDemandsForStartup(
  input: { profile: unknown; candidates: Array<{ demand_id: string } & Record<string, unknown>> },
  deps?: TaskDeps,
) {
  if (input.candidates.length === 0) throw new AiError('VALIDATION_ERROR', 'No candidates to explain.', 400);
  const candidates = input.candidates.slice(0, MAX_CANDIDATES);
  const ids = candidates.map((c) => c.demand_id);
  const report: GuardReport = newReport();

  const { data, meta } = await runTask({
    schema: DemandExplanationsSchema,
    user: demandMatchPrompt({ profile: input.profile, candidates }),
    promptVersion: PROMPT_VERSIONS.demandMatch,
    maxTokens: 1200,
    temperature: 0.2,
    deps,
  });

  const sourceText = JSON.stringify({ profile: input.profile, candidates });
  const cleaned = sanitizeStrings(data.explanations, sourceText, report) as DemandExplanation[];
  const explanations = groundDemandExplanations(cleaned, ids, report);

  return {
    explanations,
    missing_explanations: ids.filter((id) => !explanations.some((e) => e.demand_id === id)),
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.demandMatch },
  };
}

export interface ScoredCandidate {
  startupId: string;
  demandId: string;
  score: number; // read-only, from the backend scorer
  startup: unknown; // record as provided by the backend
  eligibility: unknown; // hard-gate result from the backend
}

export async function explainMatches(
  input: { demand: unknown; demandId: string; candidates: ScoredCandidate[] },
  deps?: TaskDeps,
) {
  if (input.candidates.length === 0) throw new AiError('VALIDATION_ERROR', 'No candidates to explain.', 400);
  const candidates = input.candidates.slice(0, MAX_CANDIDATES);
  for (const c of candidates) {
    if (c.demandId !== input.demandId) throw new AiError('VALIDATION_ERROR', 'Candidate does not match the demand.', 400);
  }

  const allowed = candidates.map((c) => ({ startupId: c.startupId, demandId: c.demandId }));
  const schema = z.object({ explanations: z.array(MatchExplanationSchema).max(MAX_CANDIDATES) }).strict();
  const user = reasoningPrompt({
    demand: input.demand,
    candidates: candidates.map((c) => ({
      startup: c.startup,
      score: c.score,
      eligibility: c.eligibility,
    })),
  });

  const sourceText = JSON.stringify({ demand: input.demand, candidates: candidates.map((c) => c.startup) });
  const report: GuardReport = newReport();

  const { data, meta } = await runTask({
    schema,
    user,
    promptVersion: PROMPT_VERSIONS.reasoning,
    maxTokens: 1200,
    temperature: 0.2,
    deps,
  });

  const cleaned = sanitizeStrings(data.explanations, sourceText, report) as MatchExplanation[];
  const grounded = groundExplanations(cleaned, allowed, report);

  // Missing explanations are reported so the UI can show the deterministic reasons instead.
  const missing = allowed.filter((a) => !grounded.some((g) => g.startup_id === a.startupId));

  return {
    // Scores and order come from the input, never from the model.
    results: candidates.map((c) => ({
      startup_id: c.startupId,
      demand_id: c.demandId,
      score: c.score,
      explanation: grounded.find((g) => g.startup_id === c.startupId) ?? null,
    })),
    missing_explanations: missing.map((m) => m.startupId),
    guard: report,
    meta: { ...meta, prompt_version: PROMPT_VERSIONS.reasoning },
  };
}
