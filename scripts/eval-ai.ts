// AI evaluation runner.
//   npx tsx scripts/eval-ai.ts            -> offline: validates case files only (no network)
//   npx tsx scripts/eval-ai.ts --live     -> live: calls Gemma through OpenRouter (needs OPENROUTER_API_KEY)
// Writes docs/ai-eval-report.json. Automated checks cover what code can verify (IDs, status, overclaims,
// contacts, word limits, required milestones, language heuristics). Judgement items (expect_flag) need human review.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractStartupProfile } from '../src/lib/ai/passport';
import { explainDemandsForStartup } from '../src/lib/ai/reasoning';
import { toRequestProfile } from '../src/lib/contract';
import { generatePocPlan } from '../src/lib/ai/poc';
import { draftOutreach } from '../src/lib/ai/outreach';
import { suggestNextAction, type RecordedEvent } from '../src/lib/ai/next-action';
import { findOverclaims } from '../src/lib/ai/postvalidate';
import { readAiConfig } from '../src/lib/ai/config';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--live');
const load = <T>(rel: string): T => JSON.parse(readFileSync(resolve(root, rel), 'utf8'));

const CONTACT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}|https?:\/\/\S+/i;

// Fixed inputs: the demand record is DEMO-CH-001 from handover section 22.3; the profile is the AgriSmart Passport fixture.
const DEMAND = {
  id: 'DEMO-CH-001', demand_kind: 'corporate_challenge', buyer_name: 'Nusantara Food & Farms Innovation Lab (Synthetic Demo)',
  title: 'Offline-ready crop disease detection pilot', country: 'Indonesia', industry: 'AgriTech',
  problem: 'Pilot an affordable phone-based disease screening tool at a small group of farms.',
  must_have: ['crop disease detection', 'mobile workflow'], nice_to_have: ['offline-first', 'multi-language UI'],
  stages: ['Pre-seed', 'Seed', 'Series A'], goals: ['Pilot Partnership', 'Market Expansion'], data_status: 'synthetic_demo',
};
// Fixtures are generated from the real handlers (npm run fixtures), so they match the public contract.
const AGRISMART = toRequestProfile(load<{ profile: Parameters<typeof toRequestProfile>[0] }>('src/lib/ai/fixtures/analyze-agrismart.json').profile);
const POC_FIXTURE = load<{ plan: Record<string, unknown> }>('src/lib/ai/fixtures/poc-agrismart.json').plan;

const report: Record<string, unknown> = {
  generated_at: new Date().toISOString(),
  mode: live ? 'live' : 'offline_validation',
};

// Offline checks on the case files.
const pass = load<{ version: string; cases: Array<{ id: string; group: string }> }>('evals/v2/passport-cases.json');
const groups: Record<string, number> = {};
for (const c of pass.cases) groups[c.group] = (groups[c.group] ?? 0) + 1;
report.passport_version = pass.version;
report.passport_groups = groups;
report.case_files = {
  passport: pass.cases.length,
  match: load<{ cases: unknown[] }>('evals/v2/match-cases.json').cases.length,
  poc: load<{ cases: unknown[] }>('evals/v2/poc-cases.json').cases.length,
  outreach: load<{ cases: unknown[] }>('evals/v2/outreach-cases.json').cases.length,
  coach: load<{ cases: unknown[] }>('evals/v2/next-action-cases.json').cases.length,
};

if (!live) {
  console.log('Offline validation only. No model was called.');
  // Offline mode only prints. It must never overwrite the live report in docs/ai-eval-report.json.
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

async function main() {
  readAiConfig(); // fails fast if the key is missing
  const sections: Record<string, Record<string, unknown>> = {};
  const latencies: number[] = [];
  const track = (ms: number) => latencies.push(ms);

  // ---------- Passport ----------
  {
    type PC = { id: string; group: string; input: string; expect: Record<string, string | null>; must_not_contain?: string[]; must_list_missing?: string[]; accept_goals?: string[] };
    const cases = load<{ cases: PC[] }>('evals/v2/passport-cases.json').cases;
    const rows: Array<Record<string, unknown>> = [];
    let schemaValid = 0, fieldOk = 0, fieldTotal = 0, unknownOk = 0, unknownTotal = 0, leaks = 0, contactLeaks = 0, errors = 0;
    for (const c of cases) {
      try {
        const out = await extractStartupProfile({ description: c.input });
        track(out.meta.latency_ms);
        schemaValid++;
        const p = out.profile as unknown as Record<string, unknown>;
        const misses: string[] = [];
        for (const [key, want] of Object.entries(c.expect)) {
          if (want === null) {
            unknownTotal++;
            if (p[key] === null) unknownOk++; else misses.push(`${key} should be unknown`);
          } else {
            fieldTotal++;
            const ok = c.accept_goals && key === 'primary_goal' ? c.accept_goals.includes(String(p[key])) : p[key] === want;
            if (ok) fieldOk++; else misses.push(`${key}=${p[key]} (want ${want})`);
          }
        }
        for (const m of c.must_list_missing ?? []) {
          if (!(out.profile.missing_fields as string[]).includes(m)) misses.push(`missing_fields lacks ${m}`);
        }
        // description is the founder's verbatim text, so leak and contact checks skip it.
        const { description: _verbatim, ...modelFields } = out.profile;
        const dump = JSON.stringify(modelFields);
        for (const bad of c.must_not_contain ?? []) if (dump.includes(bad)) { leaks++; misses.push(`contains "${bad}"`); }
        if (CONTACT_RE.test(dump)) contactLeaks++;
        rows.push({ id: c.id, ok: misses.length === 0, misses, ...(misses.length ? { model_fields: modelFields } : {}) });
      } catch (err) {
        errors++;
        rows.push({ id: c.id, ok: false, error: (err as { code?: string }).code ?? 'UNKNOWN' });
      }
    }
    sections.passport = {
      cases: cases.length, cases_passed: rows.filter((r) => r.ok).length,
      schema_valid_rate_pct: pct(schemaValid, cases.length),
      profile_field_accuracy_pct: pct(fieldOk, fieldTotal),
      unknown_field_handling_pct: pct(unknownOk, unknownTotal),
      prompt_leak_or_injection_failures: leaks, contact_leaks_in_output: contactLeaks, call_errors: errors,
      rows,
    };
  }

  // ---------- Reverse match ----------
  {
    const cases = load<{ cases: Array<{ id: string; kind: string; startup: string; expect_flag: string }> }>('evals/v2/match-cases.json').cases;
    const rows: Array<Record<string, unknown>> = [];
    let idOk = 0, claimFree = 0, errors = 0, missingEvidenceOk = 0, missingEvidenceTotal = 0;
    for (const c of cases) {
      // The production path: one startup profile against a backend-scored demand record.
      const profile = { ...AGRISMART, description: c.startup };
      const candidate = {
        demand_id: DEMAND.id, title: DEMAND.title, industry: DEMAND.industry, country: DEMAND.country, problem: DEMAND.problem,
        must_have: DEMAND.must_have, nice_to_have: DEMAND.nice_to_have, data_status: DEMAND.data_status, score: 60, unknowns: [],
      };
      try {
        const out = await explainDemandsForStartup({ profile, candidates: [candidate] });
        track(out.meta.latency_ms);
        const ex = out.explanations[0] ?? null;
        const idsOk = out.explanations.every((e) => e.demand_id === DEMAND.id) && out.missing_explanations.length === 0;
        if (idsOk) idOk++;
        const text = JSON.stringify(ex ?? {});
        const overclaims = findOverclaims(text);
        if (overclaims.length === 0 && !CONTACT_RE.test(text)) claimFree++;
        if (c.expect_flag === 'missing_evidence' || c.expect_flag === 'missing_field_proof') {
          missingEvidenceTotal++;
          if (ex && ex.missing_evidence.length > 0) missingEvidenceOk++;
        }
        rows.push({ id: c.id, kind: c.kind, expect_flag: c.expect_flag, ok: idsOk && overclaims.length === 0, explanation: ex, review: 'human' });
      } catch (err) {
        errors++;
        rows.push({ id: c.id, ok: false, error: (err as { code?: string }).code ?? 'UNKNOWN' });
      }
    }
    sections.reverse_match = {
      cases: cases.length, allowed_id_rate_pct: pct(idOk, cases.length),
      claim_free_rate_pct: pct(claimFree, cases.length), missing_evidence_flagged_pct: pct(missingEvidenceOk, missingEvidenceTotal),
      call_errors: errors, rows, note: 'expect_flag labels need human review; automated checks cover IDs, scores, overclaims and contacts only.',
    };
  }

  // ---------- POC ----------
  {
    const cases = load<{ cases: Array<{ id: string; duration_days: number; scenario: string; expect_flag: string }> }>('evals/v2/poc-cases.json').cases;
    const rows: Array<Record<string, unknown>> = [];
    let proposed = 0, noOverclaim = 0, hasDiscovery = 0, hasConsent = 0, errors = 0;
    for (const c of cases) {
      try {
        const out = await generatePocPlan({ profile: AGRISMART, demand: { ...DEMAND, founder_note: c.scenario }, durationDays: c.duration_days });
        track(out.meta.latency_ms);
        if (out.status === 'proposed') proposed++;
        if (findOverclaims(JSON.stringify(out.plan)).length === 0) noOverclaim++;
        if (!out.guard.notes.some((n) => /discovery/.test(n))) hasDiscovery++;
        if (!out.guard.notes.some((n) => /consent/.test(n))) hasConsent++;
        rows.push({ id: c.id, expect_flag: c.expect_flag, status: out.status, duration: out.plan.proposed_duration_days, guard_notes: out.guard.notes, review: 'human' });
      } catch (err) {
        errors++;
        rows.push({ id: c.id, ok: false, error: (err as { code?: string }).code ?? 'UNKNOWN' });
      }
    }
    sections.poc = {
      cases: cases.length, status_proposed_rate_pct: pct(proposed, cases.length), no_overclaim_rate_pct: pct(noOverclaim, cases.length),
      discovery_milestone_present_pct: pct(hasDiscovery, cases.length), consent_milestone_present_pct: pct(hasConsent, cases.length),
      call_errors: errors, rows,
    };
  }

  // ---------- Outreach ----------
  {
    const cases = load<{ cases: Array<{ id: string; language: 'English' | 'Bahasa Melayu' | 'Bahasa Indonesia'; scenario: string }> }>('evals/v2/outreach-cases.json').cases;
    const rows: Array<Record<string, unknown>> = [];
    let within = 0, clean = 0, langOk = 0, langTotal = 0, errors = 0;
    const EN_WORDS = /\b(the|and|with|our|your|would|we|to)\b/gi;
    for (const c of cases) {
      try {
        const out = await draftOutreach({ language: c.language, profile: AGRISMART, demand: DEMAND, plan: POC_FIXTURE });
        track(out.meta.latency_ms);
        const words = out.draft.body.trim().split(/\s+/).length;
        if (words <= 180) within++;
        const text = `${out.draft.subject} ${out.draft.body}`;
        if (!CONTACT_RE.test(text) && findOverclaims(text).length === 0) clean++;
        // Heuristic only: a non-English draft should not read as English.
        if (c.language !== 'English') {
          langTotal++;
          const enHits = (out.draft.body.match(EN_WORDS) ?? []).length;
          if (enHits / Math.max(1, words) < 0.08) langOk++;
        } else {
          langTotal++;
          if ((out.draft.body.match(EN_WORDS) ?? []).length / Math.max(1, words) >= 0.08) langOk++;
        }
        rows.push({ id: c.id, language: c.language, words, subject: out.draft.subject, body: out.draft.body, repaired: out.meta.repaired, review: 'human' });
      } catch (err) {
        errors++;
        rows.push({ id: c.id, ok: false, error: (err as { code?: string }).code ?? 'UNKNOWN' });
      }
    }
    sections.outreach = {
      cases: cases.length, within_180_words_pct: pct(within, cases.length), clean_no_contacts_or_overclaims_pct: pct(clean, cases.length),
      language_heuristic_pct: pct(langOk, langTotal), call_errors: errors, rows,
      note: 'Language check is a heuristic (English function-word ratio). Native-speaker review is still needed.',
    };
  }

  // ---------- Next action (P1) ----------
  {
    const cases = load<{ cases: Array<{ id: string; events: string[]; scenario: string; expect_flag: string }> }>('evals/v2/next-action-cases.json').cases;
    const rows: Array<Record<string, unknown>> = [];
    let idsOk = 0, noOverclaim = 0, errors = 0;
    for (const c of cases) {
      const events: RecordedEvent[] = c.events.map((type, i) => ({
        id: `EVT-${c.id}-${i + 1}`, event_type: type, from_state: 'identified', to_state: 'qualified',
        happened_at: '2026-10-29T03:00:00.000Z', evidence_status: 'synthetic_demo', note: c.scenario,
      }));
      try {
        const out = await suggestNextAction({ events });
        track(out.meta.latency_ms);
        const known = out.advice.based_on_event_ids.every((id) => events.some((e) => e.id === id));
        if (known) idsOk++;
        if (findOverclaims(JSON.stringify(out.advice)).length === 0) noOverclaim++;
        rows.push({ id: c.id, expect_flag: c.expect_flag, advice: out.advice, review: 'human' });
      } catch (err) {
        errors++;
        rows.push({ id: c.id, ok: false, error: (err as { code?: string }).code ?? 'UNKNOWN' });
      }
    }
    sections.next_action = {
      cases: cases.length, known_event_ids_pct: pct(idsOk, cases.length), no_overclaim_pct: pct(noOverclaim, cases.length),
      call_errors: errors, rows,
    };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const q = (x: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(x * sorted.length))] : null);
  report.latency_p50_ms = q(0.5);
  report.latency_p95_ms = q(0.95);
  report.calls_measured = latencies.length;
  report.sections = Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, stripRows(v)]));
  report.rows = Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.rows]));

  console.log(JSON.stringify({ latency_p50_ms: report.latency_p50_ms, latency_p95_ms: report.latency_p95_ms, calls_measured: report.calls_measured, sections: report.sections }, null, 2));
  writeFileSync(resolve(root, 'docs/ai-eval-report.json'), JSON.stringify(report, null, 2));
  console.log('Report written to docs/ai-eval-report.json');
}

function pct(a: number, b: number) {
  return b === 0 ? null : Math.round((a / b) * 1000) / 10;
}

// Summary view without the per-case rows (those are kept in report.rows).
function stripRows(v: Record<string, unknown>) {
  const { rows: _r, ...rest } = v;
  return rest;
}

main().catch((err) => {
  console.error('Evaluation failed:', (err as { code?: string }).code ?? 'UNKNOWN');
  process.exitCode = 1;
});
