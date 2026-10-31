import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DealTrackerView } from '../src/components/DealTrackerView';
import { OutcomeAnalyticsView } from '../src/components/OutcomeAnalyticsView';
import { InvestorReadinessView } from '../src/components/InvestorReadinessView';
import BridgeAiMainPage from '../src/app/page';
import { AGRISMART_PRESET } from '../src/components/StartupPassportFlow';
import {
  getDemoCohortDeals,
  createQualifiedDealFromMatch,
  resetLocalDeals,
  getLocalDeals,
} from '../src/lib/repositories/deal-local-client';
import demandBriefs from '../src/data/demand-briefs.json';
import type { DemandBrief } from '../src/types';
import { POST as analyzePost } from '../src/app/api/analyze/route';
import { GET as challengesGet } from '../src/app/api/challenges/route';
import { POST as demandMatchesPost } from '../src/app/api/demand/matches/route';
import { POST as pocPost } from '../src/app/api/poc/route';
import { POST as ttsPost } from '../src/app/api/tts/route';
import { KokoroTtsButton } from '../src/components/KokoroTtsButton';

describe('Task 7 & 8: DealTrackerView, OutcomeAnalyticsView, InvestorReadinessView, API Routes & Main App', () => {
  const briefs = demandBriefs as DemandBrief[];
  const demoDeals = getDemoCohortDeals();

  beforeEach(() => {
    resetLocalDeals();
  });

  it('renders DealTrackerView with verbatim LocalStorage honesty banner, KPI tiles, chevron funnel, AI follow-up banner, and 30/90/180 check-in cards', () => {
    const localDeal = createQualifiedDealFromMatch({
      startupName: 'AgriSmart',
      demand: briefs[0],
    });

    const html = renderToStaticMarkup(
      React.createElement(DealTrackerView, {
        localDeals: [localDeal],
        demoDeals,
        onTransitionDeal: vi.fn(),
        onAddTask: vi.fn(),
        onToggleTask: vi.fn(),
        onOpenChallenges: vi.fn(),
      })
    );

    expect(html).toContain(
      '🔒 Browser LocalStorage Mode: Your saved deals and stage transitions are persisted locally on this device. Synthetic demo cohort records are badged separately.'
    );
    expect(html).toContain('All Deals (Local + Demo Cohort)');
    expect(html).toContain('My Saved Deals (1)');
    expect(html).toContain('Synthetic Demo Cohort (6)');
    expect(html).toContain('Total Tracked Deals');
    expect(html).toContain('Active Qualified / POC Deals');
    expect(html).toContain('Pending Follow-ups');
    expect(html).toContain('Signed / Paid Outcomes');
    expect(html).toContain('📋 Copy Follow-up Draft');
    expect(html).toContain('ActivityTimeline');
    expect(html).toContain('30 Days');
    expect(html).toContain('90 Days');
    expect(html).toContain('180 Days');
  });

  it('renders OutcomeAnalyticsView with cohort switcher, honest zero-denominator em-dash, explicit numerators/denominators, and visual charts', () => {
    const localDeal = createQualifiedDealFromMatch({
      startupName: 'AgriSmart',
      demand: briefs[0],
    });

    const html = renderToStaticMarkup(
      React.createElement(OutcomeAnalyticsView, {
        localDeals: [localDeal],
        demoDeals,
        defaultCohort: 'local',
      })
    );

    expect(html).toContain(
      '🌱 My Local Recorded Deals (1) — Actual Browser Events'
    );
    expect(html).toContain(
      '📊 Synthetic Demo Cohort (6) — Illustrative Funnel'
    );
    expect(html).toContain('🔀 Combined View (Local + Demo Labelled)');
    expect(html).toContain('POC → Paid Conversion Rate');
    expect(html).toContain('0 paid / 0 completed POCs');
    expect(html).toContain('— (In progress — no closed deals yet)');
    expect(html).toContain('Proposals are activity, not closed revenue');
    expect(html).toContain(
      'Outcomes Over Time (POCs Started vs Contracts Signed)'
    );
    expect(html).toContain('Deals by Sector');
    expect(html).toContain('Top ASEAN Countries by Outcomes');
  });

  it('renders InvestorReadinessView with 78/100 score ring, 5 checklist categories, Rule #14 security notice, and Thailand NIA historical reference badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(InvestorReadinessView, {
        profile: AGRISMART_PRESET,
      })
    );

    expect(html).toContain('78/100');
    expect(html).toContain('Financials');
    expect(html).toContain('Traction &amp; Metrics');
    expect(html).toContain('Product Deck');
    expect(html).toContain('Legal &amp; Governance Docs');
    expect(html).toContain('Team Information');
    expect(html).toContain('Company Overview Deck');
    expect(html).toContain('Financial Model (Redacted Summary)');
    expect(html).toContain('Cap Table Structure');
    expect(html).toContain('Incorporation Certificate');
    expect(html).toContain('Field Pilot Protocol');
    expect(html).toContain(
      'Security Boundary (Rule #14): Prototype tracks document readiness metadata only. Real investor data rooms require P2 authenticated encrypted storage.'
    );
    expect(html).toContain('Entity &amp; Local Establishment Questions');
    expect(html).toContain('Cross-Border Data &amp; Privacy Checks');
    expect(html).toContain('Sector Regulatory Questions');
    expect(html).toContain('Local Pilot &amp; Distribution Questions');
    expect(html).toContain('Startup ASEAN Public Portal');
    expect(html).toContain('Thailand NIA Global Startup Hub 2026');
    expect(html).toContain(
      'Historical Reference — Application window closed 15 Mar 2026'
    );
  });

  it('validates /api/analyze, /api/challenges, /api/demand/matches, and /api/poc route handlers', async () => {
    // 1. POST /api/analyze
    const analyzeReq = new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: AGRISMART_PRESET.description,
      }),
    });
    const analyzeRes = await analyzePost(analyzeReq);
    expect(analyzeRes.status).toBe(200);
    const analyzeJson = await analyzeRes.json();
    expect(analyzeJson.profile.startup_name).toBe('AgriSmart');
    expect(analyzeJson.profile.industry).toBe('AgriTech');
    expect(analyzeJson.meta.prompt_version).toBe('passport-v2');
    expect(['gemma_live', 'demo_fixture']).toContain(
      analyzeJson.meta.ai_source
    );

    // 2. GET /api/challenges
    const challengesReq = new Request(
      'http://localhost:3000/api/challenges?country=Indonesia'
    );
    const challengesRes = await challengesGet(challengesReq);
    expect(challengesRes.status).toBe(200);
    const challengesJson = await challengesRes.json();
    expect(challengesJson.challenges.length).toBeGreaterThan(0);
    expect(
      challengesJson.challenges.every(
        (c: DemandBrief) =>
          c.country === 'Indonesia' && c.data_status === 'synthetic_demo'
      )
    ).toBe(true);

    // 3. POST /api/demand/matches
    const matchesReq = new Request('http://localhost:3000/api/demand/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: AGRISMART_PRESET }),
    });
    const matchesRes = await demandMatchesPost(matchesReq);
    expect(matchesRes.status).toBe(200);
    const matchesJson = await matchesRes.json();
    expect(matchesJson.matches[0].demand_id).toBe('DEMO-CH-001');
    expect(matchesJson.matches[0].score).toBe(85);
    expect(matchesJson.meta.scoring_engine).toBe('deterministic_rubric_v2');

    // 4. POST /api/poc
    const pocReq = new Request('http://localhost:3000/api/poc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: AGRISMART_PRESET,
        demandId: 'DEMO-CH-001',
        language: 'Bahasa Indonesia',
      }),
    });
    const pocRes = await pocPost(pocReq);
    expect(pocRes.status).toBe(200);
    const pocJson = await pocRes.json();
    expect(pocJson.plan.status).toBe('proposed');
    expect(pocJson.plan.proposed_duration_days).toBe(75);
    expect(pocJson.plan.outreach_email.language).toBe('Bahasa Indonesia');
    expect(pocJson.meta.prompt_version).toBe('poc-75d-v2');
  });

  it('renders main application page with HomeGateway inside AppShell and Kokoro TTS button', () => {
    expect(getLocalDeals().length).toBe(0);
    const html = renderToStaticMarkup(React.createElement(BridgeAiMainPage));
    expect(html).toContain('Bridge');
    expect(html).toContain('AgriSmart Founder · MY → ID');
    expect(html).toContain('🚀 Run AgriSmart Golden Path (1-Click Demo)');
    expect(html).toContain('🔊 Voice Briefing (Kokoro TTS)');
  });

  it('validates /api/tts Kokoro TTS route handler and KokoroTtsButton voice selector', async () => {
    const ttsReq = new Request('http://localhost:3000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'AgriSmart matches Nusantara Food and Farms Innovation Lab with 85 percent compatibility.',
        voice: 'af_heart',
        speed: 1.0,
        lang: 'en-US',
      }),
    });
    const ttsRes = await ttsPost(ttsReq);
    expect(ttsRes.status).toBe(200);
    const ttsJson = await ttsRes.json();
    expect(ttsJson.ok).toBe(true);
    expect(ttsJson.voice).toBe('af_heart');

    const btnHtml = renderToStaticMarkup(
      React.createElement(KokoroTtsButton, {
        text: 'Test Kokoro speech',
        showVoiceSelector: true,
      })
    );
    expect(btnHtml).toContain('Kokoro: Heart (F)');
    expect(btnHtml).toContain('Listen (Kokoro TTS)');
  });
});
