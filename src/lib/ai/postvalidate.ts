// Code-enforced guardrails applied after schema validation. These are not prompt instructions:
// the backend decides IDs, status, scores and whether a claim is allowed to stand.

import { SUPPORTED_COUNTRIES, type MatchExplanation, type StartupProfileOutput, type PocPlanOutput } from './schemas';

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_RE = /\bhttps?:\/\/[^\s)"']+|\bwww\.[^\s)"']+/gi;

export interface GuardReport {
  droppedUngroundedContacts: number;
  droppedUnknownIds: number;
  claimWarnings: string[];
  notes: string[];
}

export function newReport(): GuardReport {
  return { droppedUngroundedContacts: 0, droppedUnknownIds: 0, claimWarnings: [], notes: [] };
}

// Removes any email address or URL in model text that does not appear in the source text.
// Returns the cleaned text and how many items were removed.
export function stripUngroundedContacts(text: string, sourceText: string): { text: string; removed: number } {
  let removed = 0;
  const clean = (match: string) => {
    if (sourceText.includes(match)) return match;
    removed++;
    return '[removed: not in source]';
  };
  const out = text.replace(EMAIL_RE, clean).replace(URL_RE, clean);
  return { text: out, removed };
}

// Removes every email address and URL from model-written text, even when the founder typed them.
// Used where contact details have no place in the output (for example the Passport).
export function scrubAllContacts<T>(value: T, report: GuardReport): T {
  if (typeof value === 'string') {
    let removed = 0;
    const out = value
      .replace(EMAIL_RE, () => { removed++; return '[contact removed]'; })
      .replace(URL_RE, () => { removed++; return '[contact removed]'; });
    report.droppedUngroundedContacts += removed;
    return out as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => scrubAllContacts(v, report)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubAllContacts(v, report);
    return out as T;
  }
  return value;
}

export function sanitizeStrings<T>(value: T, sourceText: string, report: GuardReport): T {
  if (typeof value === 'string') {
    const r = stripUngroundedContacts(value, sourceText);
    report.droppedUngroundedContacts += r.removed;
    return r.text as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeStrings(v, sourceText, report)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeStrings(v, sourceText, report);
    return out as T;
  }
  return value;
}

// Maps free-text industry labels onto the app taxonomy (handover section 6: synonyms).
// Unmatched labels are kept as written, so nothing the founder said is lost.
export const INDUSTRY_TAXONOMY = ['AgriTech', 'AI', 'FinTech', 'HealthTech', 'EdTech', 'Logistics', 'CleanTech'] as const;
const INDUSTRY_RULES: Array<[RegExp, (typeof INDUSTRY_TAXONOMY)[number]]> = [
  [/agri|agriculture|farm|crop/i, 'AgriTech'],
  [/fin[\s-]?tech|financial technology|payment/i, 'FinTech'],
  [/health[\s-]?tech|med[\s-]?tech|digital health|telemedicine/i, 'HealthTech'],
  [/ed[\s-]?tech|education/i, 'EdTech'],
  [/logistic|supply chain|delivery/i, 'Logistics'],
  [/clean[\s-]?tech|clean energy|renewable|solar/i, 'CleanTech'],
  [/\bai\b|artificial intelligence|machine learning|computer vision/i, 'AI'],
];

export function normalizeIndustry(label: string | null): string | null {
  if (!label) return null;
  const hit = INDUSTRY_RULES.find(([re]) => re.test(label));
  return hit ? hit[1] : label;
}

// Keeps the profile honest: unsupported countries become null, and every null
// matching field is listed in missing_fields.
export function normalizeProfile(profile: StartupProfileOutput, report: GuardReport): StartupProfileOutput {
  const supported = new Set<string>(SUPPORTED_COUNTRIES.map((c) => c.toLowerCase()));
  const fixCountry = (c: string | null, label: string) => {
    if (c === null) return null;
    if (supported.has(c.toLowerCase())) return SUPPORTED_COUNTRIES.find((s) => s.toLowerCase() === c.toLowerCase()) ?? c;
    report.notes.push(`${label} "${c}" is not a supported country; set to null`);
    return null;
  };
  const home = fixCountry(profile.home_country, 'home_country');
  const target = fixCountry(profile.target_country, 'target_country');

  const missing = new Set(profile.missing_fields);
  const required: Array<[keyof StartupProfileOutput, string]> = [
    ['industry', 'industry'],
    ['target_country', 'target_country'],
    ['stage', 'stage'],
    ['primary_goal', 'primary_goal'],
  ];
  const values: Record<string, unknown> = { industry: profile.industry, target_country: target, stage: profile.stage, primary_goal: profile.primary_goal };
  for (const [, name] of required) {
    if (values[name] === null || values[name] === undefined) missing.add(name);
  }
  return {
    ...profile,
    industry: normalizeIndustry(profile.industry),
    home_country: home,
    target_country: target,
    missing_fields: [...missing].slice(0, 10),
  };
}

// Drops explanations whose IDs were not supplied, and keeps supplied order.
export function groundExplanations(
  explanations: MatchExplanation[],
  allowed: Array<{ startupId: string; demandId: string }>,
  report: GuardReport,
): MatchExplanation[] {
  const allowedKey = new Set(allowed.map((a) => `${a.startupId}|${a.demandId}`));
  const seen = new Set<string>();
  const kept: MatchExplanation[] = [];
  for (const e of explanations) {
    const key = `${e.startup_id}|${e.demand_id}`;
    if (!allowedKey.has(key) || seen.has(key)) {
      report.droppedUnknownIds++;
      continue;
    }
    seen.add(key);
    kept.push(e);
  }
  return allowed
    .map((a) => kept.find((e) => e.startup_id === a.startupId && e.demand_id === a.demandId))
    .filter((e): e is MatchExplanation => Boolean(e));
}

// Claims that must not appear as facts in a proposed plan. Only completed-status wording is matched,
// so drafting phrases such as "to be agreed" or "subject to agreement" stay allowed.
// Negated uses ("not signed", "no agreement") are also allowed.
const OVERCLAIM_RE = new RegExp(
  [
    String.raw`\b(?:is|are|was|were|has been|have been|already|now)\s+(?:signed|agreed|funded|paid|approved|secured)\b`,
    String.raw`\b(?:has|have)\s+(?:signed|agreed|paid|funded)\b`,
    String.raw`\balready\s+(?:signed|agreed|paid|funded)\b`,
    String.raw`\bsigned and paid\b`,
    String.raw`\bapproved by (?:the )?government\b`,
    String.raw`\bguaranteed\b`,
    String.raw`\bcontract (?:is )?in place\b`,
  ].join('|'),
  'gi',
);
const NEGATION_RE = /\b(not|no|never|until|unless|if|subject to|pending|once|after|without|requires?|check|confirm)\b/i;

export function findOverclaims(text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(OVERCLAIM_RE)) {
    const idx = m.index ?? 0;
    const window = text.slice(Math.max(0, idx - 40), idx);
    if (!NEGATION_RE.test(window)) hits.push(m[0]);
  }
  return hits;
}

const DISCOVERY_RE = /discovery|introductory|first meeting|exploratory call/i;
const CONSENT_RE = /consent|data[- ]access|data sharing|permission/i;

// Applies the POC rules that code can check. Returns the plan with status forced to 'proposed'.
export function finalizePocPlan(plan: PocPlanOutput, report: GuardReport): PocPlanOutput & { status: 'proposed' } {
  const milestones = [...plan.milestones].sort((a, b) => a.day - b.day);
  const hasDiscovery = milestones.some((m) => DISCOVERY_RE.test(m.action));
  const hasConsent = milestones.some((m) => CONSENT_RE.test(m.action));
  if (!hasDiscovery) report.notes.push('POC plan has no discovery meeting milestone; added a warning');
  if (!hasConsent) report.notes.push('POC plan has no data-access or consent milestone; added a warning');

  const allText = JSON.stringify(plan);
  report.claimWarnings.push(...findOverclaims(allText));

  return { ...plan, milestones, status: 'proposed' };
}
