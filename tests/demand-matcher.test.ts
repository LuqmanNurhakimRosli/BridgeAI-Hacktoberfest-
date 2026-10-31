import { describe, expect, it } from 'vitest';
import { assessDemand, missingGateFields, rankDemands } from '../src/lib/demand-matcher';
import { demandBriefs, demandById } from '../src/lib/catalog';
import { agriSmart } from './helpers';

describe('demand matcher', () => {
  it('scores the AgriSmart golden path against DEMO-CH-001 with self-declared must-haves at 50%', () => {
    const a = assessDemand(agriSmart, demandById.get('DEMO-CH-001')!);
    expect(a.score_breakdown).toEqual({ sector: 30, must_have: 15, geography: 15, stage: 15, readiness: 0 });
    expect(a.score).toBe(75);
    expect(a.hard_eligibility).toBe('needs_verification');
    expect(a.withheld_reasons).toEqual([]);
  });

  it('withholds a candidate whose goal does not match, with the reason attached', () => {
    const a = assessDemand(agriSmart, demandById.get('DEMO-VC-001')!);
    expect(a.hard_eligibility).toBe('withheld');
    expect(a.withheld_reasons).toContain('goal_mismatch');
  });

  it('withholds on stage incompatibility', () => {
    const a = assessDemand({ ...agriSmart, stage: 'Growth' }, demandById.get('DEMO-CH-001')!);
    expect(a.withheld_reasons).toContain('stage_incompatible');
    expect(a.score_breakdown.stage).toBe(0);
  });

  it('never returns eligible in P0, because nothing is verified', () => {
    for (const d of demandBriefs) {
      expect(['needs_verification', 'withheld']).toContain(assessDemand(agriSmart, d).hard_eligibility);
    }
  });

  it('gives a must-have no credit when the founder did not declare it', () => {
    const a = assessDemand({ ...agriSmart, capability_tags: [] }, demandById.get('DEMO-CH-001')!);
    expect(a.score_breakdown.must_have).toBe(0);
    expect(a.unknowns).toContain('Not evidenced: crop disease detection');
  });

  it('maps industry synonyms to one canonical value', () => {
    const a = assessDemand({ ...agriSmart, industry: 'agriculture technology' }, demandById.get('DEMO-CH-001')!);
    expect(a.score_breakdown.sector).toBe(30);
  });

  it('ranks by score, then by ID, so ties are stable', () => {
    const ranked = rankDemands(agriSmart, [...demandBriefs].reverse());
    expect(ranked.map((r) => r.demand_id)).toEqual(['DEMO-CH-001', 'DEMO-CH-002', 'DEMO-VC-001']);
  });

  it('returns an empty list for an empty pool', () => {
    expect(rankDemands(agriSmart, [])).toEqual([]);
  });

  it('reports missing gate fields instead of scoring incomplete profiles', () => {
    expect(missingGateFields({ ...agriSmart, target_country: null, stage: null })).toEqual(['target_country', 'stage']);
    expect(missingGateFields(agriSmart)).toEqual([]);
  });
});
