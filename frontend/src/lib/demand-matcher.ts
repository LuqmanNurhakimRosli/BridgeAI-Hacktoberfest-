import type { DemandBrief, ReverseMatch, StartupProfile } from '@/types';

export const DEMAND_RUBRIC_WEIGHTS = {
  sectorRelevance: 30,
  mustHaveCoverage: 30,
  geographyDeliverability: 15,
  stageEligibility: 15,
  pilotReadiness: 10,
} as const;

const SYNONYM_GROUPS: Record<string, string[]> = {
  'crop disease detection': [
    'crop disease',
    'leaf-disease',
    'leaf disease',
    'plant disease',
    'blight',
    'agronomic diagnosis',
    'pest detection',
  ],
  'mobile workflow': [
    'mobile',
    'phone-based',
    'smartphone',
    'android',
    'ios',
    'field app',
    'mobile app',
  ],
  'offline-first': ['offline', 'low-connectivity', 'edge inference', 'on-device'],
  'multi-language ui': ['multi-language', 'multilingual', 'bahasa', 'local language'],
  'fleet routing optimization': ['fleet', 'routing', 'dispatch', 'logistics', 'mobility'],
  'real-time telemetry api': ['telemetry', 'real-time', 'iot', 'gps', 'api'],
  'alternative credit scoring': ['credit scoring', 'underwriting', 'micro-finance', 'fintech', 'credit'],
  'explainable risk model': ['explainable', 'risk model', 'scoring model', 'ai risk'],
  'cold-chain monitoring': ['cold-chain', 'cold chain', 'temperature', 'perishable', 'supply chain'],
  'spoilage prediction': ['spoilage', 'shelf-life', 'food waste', 'waste reduction'],
  'energy load monitoring': ['energy', 'iot', 'metering', 'electricity', 'load monitoring', 'decarbonisation'],
  'scope 2 carbon reporting': ['scope 2', 'carbon', 'emissions', 'esg', 'clean energy'],
  'aquaculture disease warning': ['aquaculture', 'shrimp', 'water quality', 'pond', 'disease'],
  'validated b2b pilot': ['pilot', 'b2b', 'commercial', 'enterprise', 'traction'],
  'applied ai workflow': ['ai', 'machine learning', 'computer vision', 'deep learning', 'llm'],
  'smallholder unit economics': ['smallholder', 'farmer', 'cooperative', 'farm', 'agritech'],
};

function normalizeText(text?: string | null): string {
  return (text || '').trim().toLowerCase();
}

function buildStartupCorpus(profile: StartupProfile): string {
  return [
    profile.startup_name,
    profile.description,
    profile.industry,
    profile.product,
    ...(profile.needs || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function requirementMatchesCorpus(requirement: string, corpus: string): boolean {
  const reqNorm = normalizeText(requirement);
  if (!reqNorm) return false;
  if (corpus.includes(reqNorm)) return true;

  const synonyms = SYNONYM_GROUPS[reqNorm] || [];
  if (synonyms.some((syn) => corpus.includes(syn.toLowerCase()))) {
    return true;
  }

  // Token overlap fallback for multi-word requirements (excluding stop words)
  const tokens = reqNorm
    .split(/[\s/-]+/)
    .filter((t) => t.length > 3 && !['with', 'from', 'that', 'this'].includes(t));
  if (tokens.length === 0) return false;
  const matchedTokens = tokens.filter((t) => corpus.includes(t));
  return matchedTokens.length >= Math.ceil(tokens.length * 0.6);
}

function industriesRelated(startupIndustry: string | null, demandIndustry: string, corpus: string): 'exact' | 'related' | 'none' {
  if (!startupIndustry) return 'none';
  const sInd = normalizeText(startupIndustry);
  const dInd = normalizeText(demandIndustry);
  if (sInd === dInd) return 'exact';

  // Cross-cutting AI or Sustainability overlap
  if (
    (dInd === 'ai' && (corpus.includes('ai') || corpus.includes('machine learning'))) ||
    (sInd === 'ai' && corpus.includes(dInd)) ||
    (dInd === 'sustainability' && ['agritech', 'clean energy'].includes(sInd)) ||
    (sInd === 'sustainability' && ['agritech', 'clean energy'].includes(dInd))
  ) {
    return 'related';
  }

  return 'none';
}

export function scoreDemandMatch(profile: StartupProfile, demand: DemandBrief): ReverseMatch {
  const reasons: string[] = [];
  const unknowns: string[] = [];
  const corpus = buildStartupCorpus(profile);

  // 1. Sector / problem relevance (max 30)
  let sectorScore = 0;
  if (!profile.industry) {
    unknowns.push('Startup industry is not confirmed');
  } else {
    const rel = industriesRelated(profile.industry, demand.industry, corpus);
    if (rel === 'exact') {
      sectorScore = DEMAND_RUBRIC_WEIGHTS.sectorRelevance; // 30
      reasons.push(`Sector alignment (${demand.industry})`);
    } else if (rel === 'related') {
      sectorScore = 18;
      reasons.push(`Adjacent sector relevance (${profile.industry} → ${demand.industry})`);
    }
  }

  // 2. Demonstrated solution coverage for must-haves (max 30)
  const matchedMustHaves: string[] = [];
  const missingMustHaves: string[] = [];

  for (const req of demand.must_have) {
    if (requirementMatchesCorpus(req, corpus)) {
      matchedMustHaves.push(req);
    } else {
      missingMustHaves.push(req);
    }
  }

  const matchedNiceToHaves = (demand.nice_to_have || []).filter((req) =>
    requirementMatchesCorpus(req, corpus)
  );
  const unconfirmedNiceToHaves = (demand.nice_to_have || []).filter(
    (req) => !requirementMatchesCorpus(req, corpus)
  );

  let mustHaveScore = 0;
  if (demand.must_have.length > 0) {
    const ratio = matchedMustHaves.length / demand.must_have.length;
    // Up to 20 points for text-claimed must-have match + up to 10 points when nice-to-haves & full verification are present
    const baseMustHave = Math.round(ratio * 20);
    const hasNoMissingFields = (profile.missing_fields || []).length === 0;
    const niceToHaveBonus =
      matchedNiceToHaves.length > 0 && hasNoMissingFields
        ? 10
        : matchedNiceToHaves.length > 0
        ? 5
        : 0;
    mustHaveScore = Math.min(
      DEMAND_RUBRIC_WEIGHTS.mustHaveCoverage,
      baseMustHave + (ratio === 1 ? niceToHaveBonus : 0)
    );

    if (matchedMustHaves.length > 0) {
      reasons.push(`Covers must-have: ${matchedMustHaves.join(', ')}`);
    }
    if (missingMustHaves.length > 0) {
      unknowns.push(`Must-have not yet evidenced: ${missingMustHaves.join(', ')}`);
    }
  }

  if (unconfirmedNiceToHaves.length > 0) {
    unknowns.push(
      `Confirm optional capability in discovery: ${unconfirmedNiceToHaves.join(', ')}`
    );
  }

  // 3. Geography / deliverability (max 15)
  let geoScore = 0;
  if (!profile.target_country) {
    unknowns.push('Target country is not confirmed');
  } else if (normalizeText(profile.target_country) === normalizeText(demand.country)) {
    geoScore = DEMAND_RUBRIC_WEIGHTS.geographyDeliverability; // 15
    reasons.push(`Target market fit (${demand.country})`);
  } else if (normalizeText(profile.home_country) === normalizeText(demand.country)) {
    geoScore = 12;
    reasons.push(`Home country presence (${demand.country})`);
  } else {
    geoScore = 5;
    unknowns.push(
      `Target market is ${profile.target_country}; brief requires delivery in ${demand.country}`
    );
  }

  // 4. Stage eligibility (max 15)
  let stageScore = 0;
  let stageCompatible = false;
  if (!profile.stage) {
    unknowns.push('Startup funding stage is missing');
  } else if (demand.stages.includes(profile.stage)) {
    stageScore = DEMAND_RUBRIC_WEIGHTS.stageEligibility; // 15
    stageCompatible = true;
    reasons.push(`Stage is eligible (${profile.stage})`);
  } else {
    unknowns.push(
      `Stage mismatch: startup is ${profile.stage}, brief accepts ${demand.stages.join(', ')}`
    );
  }

  // 5. Pilot readiness / documented evidence (max 10)
  let readinessScore = 0;
  if (profile.primary_goal && demand.goals.includes(profile.primary_goal)) {
    readinessScore += 5;
    reasons.push(`Aligned with ${profile.primary_goal} track`);
  } else if (!profile.primary_goal) {
    unknowns.push('Primary partnership goal is missing');
  }

  if (profile.product && (profile.missing_fields || []).length === 0) {
    readinessScore += 5;
    reasons.push('Complete Startup Passport profile');
  } else if ((profile.missing_fields || []).length > 0) {
    for (const mf of profile.missing_fields) {
      if (!unknowns.includes(mf)) {
        unknowns.push(mf);
      }
    }
  }

  const totalScore =
    sectorScore + mustHaveScore + geoScore + stageScore + readinessScore;

  // Hard eligibility gate determination
  let hardEligibility: ReverseMatch['hard_eligibility'] = 'needs_verification';
  if (profile.stage && !stageCompatible) {
    hardEligibility = 'ineligible';
  } else if (sectorScore === 0 && matchedMustHaves.length === 0) {
    hardEligibility = 'ineligible';
  } else if (
    stageCompatible &&
    missingMustHaves.length === 0 &&
    (profile.missing_fields || []).length === 0 &&
    unconfirmedNiceToHaves.length === 0 &&
    geoScore >= 12
  ) {
    hardEligibility = 'passed';
  } else {
    hardEligibility = 'needs_verification';
  }

  const startupLabel = profile.startup_name || 'The startup';
  const fitGaps =
    unknowns.length > 0
      ? unknowns.slice(0, 3)
      : ['Confirm field data-sharing consent and pilot owner availability before launch.'];

  return {
    demand_id: demand.id,
    demand,
    score: totalScore,
    score_label: 'Deterministic rule-based compatibility score — not funding probability',
    hard_eligibility: hardEligibility,
    reasons,
    unknowns,
    ai_analysis: {
      why_match:
        reasons.length > 0
          ? `${startupLabel} aligns with ${demand.buyer_name}'s "${demand.title}" brief across ${reasons.join('; ')}.`
          : `${startupLabel} has limited documented overlap with ${demand.buyer_name}'s stated requirements.`,
      potential_collaboration: `Scope a bounded 75-day proposed pilot in ${demand.country} focused on validating ${
        demand.must_have.join(' and ') || demand.title
      } with explicit baseline metrics before any commercial procurement commitment.`,
      fit_gaps: fitGaps,
      next_action:
        hardEligibility === 'ineligible'
          ? 'Review stage and mandatory technical criteria before requesting an introduction.'
          : `Request an exploratory scoping call with ${demand.buyer_name} to verify ${
              missingMustHaves[0] || unconfirmedNiceToHaves[0] || 'pilot test protocol and data consent'
            }.`,
    },
    data_status: demand.data_status,
    ai_source: 'demo_fixture',
  };
}

export function rankDemandMatches(
  profile: StartupProfile,
  demands: DemandBrief[],
  options?: { includeIneligible?: boolean }
): ReverseMatch[] {
  const scored = demands.map((demand) => scoreDemandMatch(profile, demand));
  const filtered = options?.includeIneligible
    ? scored
    : scored.filter((m) => m.hard_eligibility !== 'ineligible' || m.score >= 35);

  return filtered.sort(
    (a, b) => b.score - a.score || a.demand_id.localeCompare(b.demand_id)
  );
}


// --- Backend Demand Matcher Exports for handlers ---
const norm = (s: string) => s.trim().toLowerCase();

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

export function canonicalIndustry(s: string | null | undefined): string | null {
  if (!s) return null;
  return INDUSTRY_SYNONYMS[norm(s)] ?? norm(s);
}

export function missingGateFields(profile: any): string[] {
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
  hard_eligibility: 'needs_verification' | 'withheld';
  withheld_reasons: string[];
};

export function assessDemand(profile: any, demand: any): Assessment {
  const reasons: string[] = [];
  const unknowns: string[] = [];
  const withheld: string[] = [];

  const stageOk = profile.stage !== null && demand.stages.includes(profile.stage);
  if (!stageOk) withheld.push('stage_incompatible');
  const goalOk = profile.primary_goal !== null && demand.goals.includes(profile.primary_goal);
  if (!goalOk) withheld.push('goal_mismatch');

  const sector = canonicalIndustry(profile.industry) === canonicalIndustry(demand.industry) ? 30 : 0;
  if (sector) reasons.push('Sector match');

  const tags = new Set((profile.capability_tags || profile.needs || []).map(norm));
  const covered = demand.must_have.filter((m: string) => tags.has(norm(m)));
  for (const m of demand.must_have.filter((m: string) => !tags.has(norm(m)))) unknowns.push(`Not evidenced: ${m}`);
  const mustHave = demand.must_have.length
    ? Math.round((30 * 0.5 * covered.length) / demand.must_have.length)
    : 0;
  if (covered.length) reasons.push(`Self-declared coverage: ${covered.join(', ')}`);

  const geography = profile.target_country && norm(profile.target_country) === norm(demand.country) ? 15 : 0;
  if (geography) reasons.push('Target country matches');
  const stage = stageOk ? 15 : 0;
  if (stageOk) reasons.push('Stage is compatible');

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

export function rankDemands(profile: any, demands: any[]): Assessment[] {
  return demands
    .map((d) => assessDemand(profile, d))
    .sort((a, b) => b.score - a.score || a.demand_id.localeCompare(b.demand_id));
}
