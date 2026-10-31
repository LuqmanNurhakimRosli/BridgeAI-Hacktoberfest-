import type { DemandBrief, StartupProfile } from './schemas';

// Deterministic. No model calls, no I/O. Scores are computed here and never by Gemma.

const INDUSTRY_SYNONYMS: Record<string, string> = {
  agritech: 'agritech',
  'agri-tech': 'agritech',
  'agriculture technology': 'agritech',
  agriculture: 'agritech',
  ai: 'ai',
  'artificial intelligence': 'ai',
  fintech: 'fintech',
  'financial technology': 'fintech',
};

const norm = (s: string) => s.trim().toLowerCase();

export function canonicalIndustry(s: string | null | undefined): string | null {
  if (!s) return null;
  return INDUSTRY_SYNONYMS[norm(s)] ?? norm(s);
}

// Profile fields the backend needs before it can score. Matching is blocked without them.
export function missingGateFields(profile: StartupProfile): string[] {
  const missing: string[] = [];
  if (!profile.target_country) missing.push('target_country');
  if (!profile.stage) missing.push('stage');
  if (!profile.primary_goal) missing.push('primary_goal');
  return missing;
}

export type Assessment = {
  demand_id: string;
  score: number;
  score_breakdown: { sector: number; must_have: number; geography: number; stage: number; readiness: number };
  reasons: string[];
  unknowns: string[];
  // In P0 nothing is verified, so a candidate is never 'eligible'. It is either withheld or needs_verification.
  hard_eligibility: 'needs_verification' | 'withheld';
  withheld_reasons: string[];
};

export function assessDemand(profile: StartupProfile, demand: DemandBrief): Assessment {
  const reasons: string[] = [];
  const unknowns: string[] = [];
  const withheld: string[] = [];

  const stageOk = profile.stage !== null && demand.stages.includes(profile.stage);
  if (!stageOk) withheld.push('stage_incompatible');
  const goalOk = profile.primary_goal !== null && demand.goals.includes(profile.primary_goal);
  if (!goalOk) withheld.push('goal_mismatch');

  const sector = canonicalIndustry(profile.industry) === canonicalIndustry(demand.industry) ? 30 : 0;
  if (sector) reasons.push('Sector match');

  // Founder-declared capabilities count at 50% because nothing is verified in P0.
  const tags = new Set(profile.capability_tags.map(norm));
  const covered = demand.must_have.filter((m) => tags.has(norm(m)));
  for (const m of demand.must_have.filter((m) => !tags.has(norm(m)))) unknowns.push(`Not evidenced: ${m}`);
  const mustHave = demand.must_have.length
    ? Math.round((30 * 0.5 * covered.length) / demand.must_have.length)
    : 0;
  if (covered.length) reasons.push(`Self-declared coverage: ${covered.join(', ')}`);

  const geography = profile.target_country && norm(profile.target_country) === norm(demand.country) ? 15 : 0;
  if (geography) reasons.push('Target country matches');
  const stage = stageOk ? 15 : 0;
  if (stageOk) reasons.push('Stage is compatible');

  // No documented pilot evidence field exists in P0, so this is always 0 with an explicit unknown.
  const readiness = 0;
  unknowns.push('No documented pilot evidence provided');

  const score_breakdown = { sector, must_have: mustHave, geography, stage, readiness };
  const score = sector + mustHave + geography + stage + readiness;

  return {
    demand_id: demand.id,
    score,
    score_breakdown,
    reasons,
    unknowns,
    hard_eligibility: withheld.length ? 'withheld' : 'needs_verification',
    withheld_reasons: withheld,
  };
}

// Sorted by score, then by ID so ties are stable. Withheld candidates stay in the list, flagged.
export function rankDemands(profile: StartupProfile, demands: DemandBrief[]): Assessment[] {
  return demands
    .map((d) => assessDemand(profile, d))
    .sort((a, b) => b.score - a.score || a.demand_id.localeCompare(b.demand_id));
}
