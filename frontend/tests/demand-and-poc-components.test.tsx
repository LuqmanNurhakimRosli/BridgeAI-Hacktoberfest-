import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import type { DemandBrief } from '../src/types';
import demandBriefs from '../src/data/demand-briefs.json';
import { rankDemandMatches, scoreDemandMatch } from '../src/lib/demand-matcher';
import { AGRISMART_PRESET } from '../src/components/StartupPassportFlow';
import { DemandBoard } from '../src/components/DemandBoard';
import { ReverseMatchDetail } from '../src/components/ReverseMatchDetail';
import {
  PilotPlanEditor,
  buildDefaultPocPlan,
  buildOutreachEmailDraft,
} from '../src/components/PilotPlanEditor';

describe('Task 5 & 6: DemandBoard, ReverseMatchDetail & PilotPlanEditor', () => {
  const briefs = demandBriefs as DemandBrief[];
  const rankedMatches = rankDemandMatches(AGRISMART_PRESET, briefs);
  const topMatch = scoreDemandMatch(AGRISMART_PRESET, briefs[0]);

  it('renders DemandBoard with verbatim AI banner, search/filter pills, provenance badges, and popular sectors', () => {
    const html = renderToStaticMarkup(
      <DemandBoard
        profile={AGRISMART_PRESET}
        matches={rankedMatches}
        onSelectMatch={vi.fn()}
        onOpenPocBuilder={vi.fn()}
      />
    );

    expect(html).toContain(
      `Based on your confirmed Startup Passport (AgriSmart), BridgeAI evaluated ${rankedMatches.length} ASEAN corporate challenges and investor theses using deterministic hard-eligibility gates + Gemma 4 grounded fit analysis.`
    );
    expect(html).toContain('+ Post Corporate Challenge / VC Thesis (P1 Demo Modal)');
    expect(html).toContain('Nusantara Food &amp; Farms Innovation Lab');
    expect(html).toContain('🧪 Synthetic Demo Record — Illustrative Only');
    expect(html).toContain('Rule-based fit, not funding probability');
    expect(html).toContain('View Match Intelligence →');
    expect(html).toContain('✨ Create 75-Day POC Plan');
    expect(html).toContain('Popular Sectors');
  });

  it('renders ReverseMatchDetail with circular compatibility gauge, V2 rubric disclaimer, and 4 intelligence cards', () => {
    const html = renderToStaticMarkup(
      <ReverseMatchDetail
        profile={AGRISMART_PRESET}
        match={topMatch}
        onBack={vi.fn()}
        onOpenPocBuilder={vi.fn()}
        onSaveQualifiedDeal={vi.fn()}
        isDealSaved={false}
      />
    );

    expect(html).toContain('← Back to Challenges Board');
    expect(html).toContain(`${topMatch.score}%`);
    expect(html).toContain(
      'Deterministic 30/30/15/15/10 Rubric Score — Not a guarantee of selection or funding'
    );
    expect(html).toContain('✨ Why it matches');
    expect(html).toContain('💡 Potential collaboration');
    expect(html).toContain('⚠️ Risks and missing information');
    expect(html).toContain('☑️ Recommended next step');
    expect(html).toContain('Key Information');
    expect(html).toContain('Sample Reference Materials (Synthetic Demo Metadata)');
    expect(html).toContain('🔖 Save as Qualified Deal');
    expect(html).toContain('✨ Create 75-Day POC Plan');
  });

  it('builds a valid 75-day proposed POCPlan via buildDefaultPocPlan and generates <=180-word multilingual outreach drafts', () => {
    const plan = buildDefaultPocPlan(AGRISMART_PRESET, topMatch);
    expect(plan.status).toBe('proposed');
    expect(plan.proposed_duration_days).toBe(75);
    expect(plan.milestones).toHaveLength(4);
    expect(plan.milestones[0].phase).toBe(
      'Phase 1: Discovery & Scoping (Days 1–10)'
    );
    expect(plan.milestones[3].phase).toBe(
      'Phase 4: Joint Evaluation & Pay/No-Pay Decision (Days 61–75)'
    );
    expect(plan.success_criteria.length).toBeGreaterThanOrEqual(3);

    for (const lang of [
      'English',
      'Bahasa Melayu',
      'Bahasa Indonesia',
    ] as const) {
      const draft = buildOutreachEmailDraft(lang, AGRISMART_PRESET, topMatch);
      const wordCount = draft.body.trim().split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(180);
      expect(draft.body).toContain('AgriSmart');
    }
  });

  it('renders PilotPlanEditor with mandatory V2 proposed banner, grant honesty card, 4 phases, and 5 governance questions', () => {
    const html = renderToStaticMarkup(
      <PilotPlanEditor
        profile={AGRISMART_PRESET}
        match={topMatch}
        onBack={vi.fn()}
        onSaveDealWithPoc={vi.fn()}
      />
    );

    expect(html).toContain(
      '✨ PROPOSED 75-Day Cross-Border Pilot Plan — Draft for Discussion Only (Not Signed, Funded, or Legally Binding)'
    );
    expect(html).toContain(
      'Grant &amp; Co-Funding Notice: External grants or corporate co-funding are NOT guaranteed by BridgeAI. Verify official programme windows before budgeting.'
    );
    expect(html).toContain('Questions to Resolve Before Starting Pilot');
    expect(html).toContain(
      'Confirm cross-border data sharing &amp; farm/user consent protocol'
    );
    expect(html).toContain(
      'Confirm foreground vs background IP ownership of model weights &amp; field data'
    );
    expect(html).toContain(
      'Confirm field-trial liability boundaries &amp; operational safety owner'
    );
    expect(html).toContain(
      'Confirm local sector regulatory / import checks in target country'
    );
    expect(html).toContain(
      'Confirm post-POC commercial conversion criteria &amp; procurement path'
    );
    expect(html).toContain('📋 Copy Outreach Draft');
    expect(html).toContain(
      '💾 Save Qualified Deal &amp; 75-Day POC Draft to Deal Tracker →'
    );
  });
});
