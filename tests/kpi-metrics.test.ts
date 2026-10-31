import { describe, expect, it } from 'vitest';
import { conversion, funnel, percent, splitBySource, timeToClose } from '../src/lib/kpi-metrics';
import type { DealEvent, DealState } from '../src/lib/schemas';

const ev = (deal: string, to: DealState, at: string, evidence: DealEvent['evidence_status'] = 'self_reported'): DealEvent => ({
  id: `${deal}-${to}`,
  deal_id: deal,
  event_type: 'transition',
  from_state: 'identified',
  to_state: to,
  happened_at: at,
  actor_id: 'demo_user',
  evidence_status: evidence,
});

describe('KPI metrics', () => {
  it('returns null, never 0%, when the denominator is zero', () => {
    expect(percent(0, 0)).toBeNull();
    expect(percent(1, 4)).toBe(25);
  });

  it('computes cohort conversion from the deals that reached the starting state', () => {
    const logs = [
      [ev('A', 'qualified', '2026-10-01T00:00:00Z'), ev('A', 'first_meeting', '2026-10-05T00:00:00Z')],
      [ev('B', 'qualified', '2026-10-01T00:00:00Z')],
      [ev('C', 'identified', '2026-10-01T00:00:00Z')],
    ];
    expect(conversion(logs, 'qualified', 'first_meeting')).toEqual({ numerator: 1, denominator: 2, rate_percent: 50 });
  });

  it('keeps synthetic and self-reported deals in separate buckets', () => {
    const logs = [
      [ev('A', 'qualified', '2026-10-01T00:00:00Z', 'synthetic_demo')],
      [ev('B', 'qualified', '2026-10-01T00:00:00Z', 'self_reported')],
    ];
    const { real, synthetic } = splitBySource(logs);
    expect(real).toHaveLength(1);
    expect(synthetic).toHaveLength(1);
    expect(funnel(real).qualified).toBe(1);
  });

  it('averages time to close only over completed deals and reports open ones as in progress', () => {
    const logs = [
      [ev('A', 'qualified', '2026-10-01T00:00:00Z'), ev('A', 'paid', '2026-10-11T00:00:00Z')],
      [ev('B', 'qualified', '2026-10-01T00:00:00Z')],
    ];
    expect(timeToClose(logs)).toEqual({ average_days: 10, completed: 1, in_progress: 1 });
  });

  it('returns a null average when nothing has closed', () => {
    expect(timeToClose([[ev('B', 'qualified', '2026-10-01T00:00:00Z')]])).toEqual({
      average_days: null,
      completed: 0,
      in_progress: 1,
    });
  });
});
