import { describe, it, expect, beforeEach } from 'vitest';
import {
  canTransitionDealState,
  getAllowedNextStates,
  getDealStateLabel,
} from '../src/lib/deal-fsm';
import {
  percent,
  reached,
  computeFunnelMetrics,
} from '../src/lib/kpi-metrics';
import {
  scoreDemandMatch,
  rankDemandMatches,
} from '../src/lib/demand-matcher';
import {
  getLocalDeals,
  getDemoCohortDeals,
  createQualifiedDealFromMatch,
  appendDealEvent,
  addDealTask,
  toggleDealTask,
  resetLocalDeals,
} from '../src/lib/repositories/deal-local-client';
import demandBriefs from '../src/data/demand-briefs.json';
import type { Deal, DemandBrief, StartupProfile } from '../src/types';

describe('Deal State Machine, Demand Matcher, Honest KPIs & Local Repository', () => {
  beforeEach(() => {
    resetLocalDeals();
  });

  it('allows valid forward transition on commercial_poc track and blocks invalid jumps', () => {
    expect(
      canTransitionDealState('commercial_poc', 'qualified', 'introduction_requested')
    ).toBe(true);
    // Cannot jump straight from qualified to paid without intermediate agreement
    expect(canTransitionDealState('commercial_poc', 'qualified', 'paid')).toBe(false);
    expect(getAllowedNextStates('commercial_poc', 'qualified')).toContain(
      'introduction_requested'
    );
    expect(getDealStateLabel('poc_running')).toBe('POC Running');
  });

  it('scores AgriSmart Golden Path deterministically against DEMO-CH-001 and enforces hard gates', () => {
    const briefs = demandBriefs as DemandBrief[];
    const nusantara = briefs.find((b) => b.id === 'DEMO-CH-001')!;

    const agriSmart: StartupProfile = {
      startup_name: 'AgriSmart',
      description:
        'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.',
      industry: 'AgriTech',
      home_country: 'Malaysia',
      target_country: 'Indonesia',
      stage: 'Seed',
      product: 'Phone-based AI leaf-disease screening app',
      primary_goal: 'Pilot Partnership',
      needs: ['Field pilot', 'Agritech corporate partner'],
      missing_fields: ['Offline field capability confirmation'],
      confidence_notes: ['Extracted from founder Golden Path narrative'],
    };

    const match = scoreDemandMatch(agriSmart, nusantara);
    expect(match.score).toBe(85);
    expect(match.hard_eligibility).toBe('needs_verification');
    expect(match.reasons.some((r) => r.includes('AgriTech'))).toBe(true);
    expect(match.unknowns.length).toBeGreaterThan(0);

    // Incompatible stage (Idea stage vs Seed/Series A VC thesis) triggers hard gate 'ineligible'
    const straitsVc = briefs.find((b) => b.id === 'DEMO-VC-001')!;
    const ideaProfile: StartupProfile = {
      ...agriSmart,
      stage: 'Idea',
    };
    const ineligibleMatch = scoreDemandMatch(ideaProfile, straitsVc);
    expect(ineligibleMatch.hard_eligibility).toBe('ineligible');

    const ranked = rankDemandMatches(agriSmart, briefs);
    expect(ranked[0].demand_id).toBe('DEMO-CH-001');
  });

  it('returns null instead of 0% when denominator is 0', () => {
    expect(percent(0, 0)).toBeNull();
    expect(percent(3, 10)).toBe(30);
  });

  it('separates synthetic_demo deals from self_reported local deals in funnel metrics', () => {
    const sampleDeals: Deal[] = [
      {
        id: 'D1',
        startup_name: 'AgriSmart',
        demand_id: 'DEMO-CH-001',
        partner_name: 'Nusantara Food & Farms Innovation Lab',
        title: 'Offline crop disease pilot',
        country: 'Indonesia',
        sector: 'AgriTech',
        track: 'commercial_poc',
        state: 'qualified',
        data_status: 'self_reported',
        events: [
          {
            id: 'E1',
            deal_id: 'D1',
            event_type: 'match_qualified',
            from_state: 'identified',
            to_state: 'qualified',
            happened_at: '2026-10-31T04:00:00Z',
            recorded_at: '2026-10-31T04:00:00Z',
            actor_id: 'demo_user',
            evidence_status: 'self_reported',
          },
        ],
        tasks: [],
        created_at: '2026-10-31T04:00:00Z',
        last_event_at: '2026-10-31T04:00:00Z',
      },
    ];
    const summary = computeFunnelMetrics(sampleDeals);
    expect(summary.qualified.numerator).toBe(1);
    expect(summary.paid.numerator).toBe(0);
    expect(summary.pocToPaidConversion.rate_percent).toBeNull();
    expect(summary.medianDaysToClose).toBeNull();
    expect(reached(sampleDeals[0].events, 'qualified')).toBe(true);
  });

  it('manages local self_reported deals, validates FSM events, and keeps demo cohort separate', () => {
    const briefs = demandBriefs as DemandBrief[];
    const nusantara = briefs[0];

    expect(getLocalDeals().length).toBe(0);
    const demoCohort = getDemoCohortDeals();
    expect(demoCohort.length).toBe(6);

    const created = createQualifiedDealFromMatch({
      startupName: 'AgriSmart',
      demand: nusantara,
    });
    expect(created.state).toBe('qualified');
    expect(created.data_status).toBe('self_reported');
    expect(getLocalDeals().length).toBe(1);

    // Valid transition: qualified -> introduction_requested
    const { deal: updatedDeal } = appendDealEvent({
      dealId: created.id,
      toState: 'introduction_requested',
      note: 'Founder explicitly requested warm intro',
    });
    expect(updatedDeal.state).toBe('introduction_requested');
    expect(updatedDeal.events.length).toBe(2);

    // Invalid jump: introduction_requested -> paid should throw
    expect(() =>
      appendDealEvent({
        dealId: created.id,
        toState: 'paid',
      })
    ).toThrow(/Invalid state transition/);

    // Add and toggle 90-day follow-up task
    const { deal: withTask } = addDealTask({
      dealId: created.id,
      title: '90-Day Pilot Evaluation Check-in',
      cadenceDays: 90,
    });
    expect(withTask.tasks.length).toBe(2);
    const addedTaskId = withTask.tasks[1].id;
    const { deal: toggled } = toggleDealTask(created.id, addedTaskId);
    expect(toggled.tasks.find((t) => t.id === addedTaskId)?.status).toBe(
      'completed'
    );
  });
});
