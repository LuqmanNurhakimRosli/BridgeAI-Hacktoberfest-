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

  it('renders DemandBoard with ranked cards, honest fit label, demo provenance and actions', () => {
    const html = renderToStaticMarkup(
      <DemandBoard
        profile={AGRISMART_PRESET}
        matches={rankedMatches}
        onSelectMatch={vi.fn()}
        onOpenPocBuilder={vi.fn()}
      />
    );

    expect(html).toContain(`${rankedMatches.length} challenges`);
    expect(html).toContain('ranked for AgriSmart');
    expect(html).toContain('Fit score is rule-based, not a funding probability');
    expect(html).toContain('Post a challenge');
    expect(html).toContain('Nusantara Food &amp; Farms Innovation Lab');
    expect(html).toContain('Demo data');
    expect(html).toContain('Draft pilot plan');
    expect(html).toContain('must-haves');
  });

  it('renders ReverseMatchDetail with fit score, disclaimer, reasons, unknowns and one primary action', () => {
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

    expect(html).toContain('All challenges');
    expect(html).toContain(`>${topMatch.score}<`);
    expect(html).toContain('It is not a funding probability or a promise of selection.');
    expect(html).toContain('Why it fits');
    expect(html).toContain('Suggested next step');
    expect(html).toContain('What is still unknown');
    expect(html).toContain('How the score is worked out');
    expect(html).toContain('What a pilot could look like');
    expect(html).toContain('Challenge requirements');
    expect(html).toContain('Save to deals');
    expect(html).toContain('Draft pilot plan');
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

  it('renders PilotPlanEditor with draft-only banner, grant honesty note, 4 phases and save action', () => {
    const html = renderToStaticMarkup(
      <PilotPlanEditor
        profile={AGRISMART_PRESET}
        match={topMatch}
        onBack={vi.fn()}
        onSaveDealWithPoc={vi.fn()}
      />
    );

    expect(html).toContain('Draft for discussion.');
    expect(html).toContain('It is not signed, funded or legally binding.');
    expect(html).toContain('Grants and co-funding are not guaranteed.');
    expect(html).toContain('Discovery &amp; Scoping');
    expect(html).toContain('Joint Evaluation &amp; Pay/No-Pay Decision');
    expect(html).toContain('poc-phase-card-4');
    expect(html).toContain('Questions');
    expect(html).toContain('Message');
    expect(html).toContain('Save plan to deals');
  });
});
