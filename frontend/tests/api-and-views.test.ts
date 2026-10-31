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

  it('renders DealTrackerView with separated sources, attention list, honest storage note and stage chip', () => {
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

    expect(html).toContain('My deals (1)');
    expect(html).toContain('Demo examples (6)');
    expect(html).toContain('Saved in this browser only. Stages change only when you record them.');
    expect(html).toContain('Needs your attention');
    expect(html).toContain('follow-ups pending');
    expect(html).toContain('signed or paid');
    expect(html).toContain('Qualified Match');
    expect(html).toContain('Saved on this device');
  });

  it('renders OutcomeAnalyticsView with separated cohorts, honest empty denominators and funnel', () => {
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

    expect(html).toContain('My deals (1)');
    expect(html).toContain('Demo examples (6)');
    expect(html).toContain('Worked out from the stage updates you recorded in this browser.');
    expect(html).toContain('Pilots that turned into paid work');
    expect(html).toContain('No finished pilots yet');
    expect(html).toContain('—');
    expect(html).toContain('Proposals and pilots are progress, not revenue.');
    expect(html).toContain('How far deals get');
    expect(html).toContain('Where your deals are');
  });

  it('renders InvestorReadinessView with self-check score, document list without sharing, market questions and closed-programme label', () => {
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
    expect(html).toContain('Document sharing isn&#x27;t available yet.');
    expect(html).toContain('This is not legal advice.');
    expect(html).toContain('Company setup');
    expect(html).toContain('Data and privacy');
    expect(html).toContain('Sector rules');
    expect(html).toContain('Running the pilot');
    expect(html).toContain('Startup ASEAN');
    expect(html).toContain('Thailand NIA Global Startup Hub 2026');
    expect(html).toContain('Closed 15 Mar 2026');
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
    expect(html).toContain('AgriSmart');
    expect(html).toContain('Confirm your startup profile');
    expect(html).toContain('Run guided demo');
    expect(html).toContain('Listen to briefing');
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
    expect(btnHtml).toContain('Heart (F)');
    expect(btnHtml).toContain('Listen');
  });
});
