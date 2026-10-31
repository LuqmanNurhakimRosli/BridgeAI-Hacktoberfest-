import { describe, it, expect } from 'vitest';
import type {
  DealState,
  DealTrack,
  DemandBrief,
  DemandKind,
  PrimaryGoal,
  SourceStatus,
  StartupStage,
} from '../src/types';
import demandBriefs from '../src/data/demand-briefs.json';
import demoDeals from '../src/data/deals-demo.json';
import {
  AGRISMART_PRESET,
  GREENTECH_PRESET,
  FINBRIDGE_PRESET,
} from '../src/components/StartupPassportFlow';

describe('Shared V2 Contracts & Seed Catalogs', () => {
  it('supports required provenance statuses', () => {
    const statuses: SourceStatus[] = [
      'synthetic_demo',
      'self_reported',
      'verified_public',
      'verified_private',
    ];
    expect(statuses).toContain('synthetic_demo');
    expect(statuses).toContain('self_reported');
  });

  it('includes qualified and paid deal states and tracks', () => {
    const states: DealState[] = ['identified', 'qualified', 'paid'];
    const tracks: DealTrack[] = ['commercial_poc', 'investment', 'market_entry'];
    const kinds: DemandKind[] = ['corporate_challenge', 'vc_thesis'];
    const stages: StartupStage[] = ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Growth'];
    const goals: PrimaryGoal[] = [
      'Investment',
      'Pilot Partnership',
      'Market Expansion',
      'Accelerator',
    ];

    expect(states.length).toBe(3);
    expect(tracks.length).toBe(3);
    expect(kinds.length).toBe(2);
    expect(stages.length).toBe(5);
    expect(goals.length).toBe(4);
  });

  it('provides 8 synthetic_demo demand briefs including DEMO-CH-001 through DEMO-VC-002', () => {
    const briefs = demandBriefs as DemandBrief[];
    expect(briefs.length).toBe(8);
    expect(briefs.every((b) => b.data_status === 'synthetic_demo')).toBe(true);
    expect(briefs.map((b) => b.id)).toEqual([
      'DEMO-CH-001',
      'DEMO-CH-002',
      'DEMO-CH-003',
      'DEMO-CH-004',
      'DEMO-CH-005',
      'DEMO-CH-006',
      'DEMO-VC-001',
      'DEMO-VC-002',
    ]);
  });

  it('provides 6 synthetic_demo cohort deals in deals-demo.json', () => {
    expect(demoDeals.length).toBe(6);
    expect(demoDeals.every((d) => d.data_status === 'synthetic_demo')).toBe(true);
  });

  it('exports StartupPassportFlow presets with verbatim AgriSmart Golden Path description', () => {
    expect(AGRISMART_PRESET.startup_name).toBe('AgriSmart');
    expect(AGRISMART_PRESET.description).toBe(
      'We are AgriSmart, a Malaysian seed-stage startup building phone-based AI leaf-disease detection. We need an Indonesian company with a real field-pilot problem to solve.'
    );
    expect(AGRISMART_PRESET.missing_fields.length).toBeGreaterThan(0);
    expect(GREENTECH_PRESET.startup_name).toBe('GreenTech Solutions');
    expect(FINBRIDGE_PRESET.startup_name).toBe('FinBridge Rural KYC');
  });
});
