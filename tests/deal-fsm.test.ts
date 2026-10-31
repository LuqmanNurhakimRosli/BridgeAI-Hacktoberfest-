import { describe, expect, it } from 'vitest';
import { applyEvent, allowedNext, deriveState } from '../src/lib/deal-fsm';
import type { DealEvent, DealState } from '../src/lib/schemas';

const ev = (id: string, from: DealState, to: DealState, extra: Partial<DealEvent> = {}): DealEvent => ({
  id,
  deal_id: 'DEAL-1',
  event_type: 'transition',
  from_state: from,
  to_state: to,
  happened_at: '2026-10-30T03:00:00.000Z',
  actor_id: 'demo_user',
  evidence_status: 'self_reported',
  ...extra,
});

// Replays a list of [from, to] pairs through applyEvent, returning the final log or the first error.
function replay(pairs: [DealState, DealState][]) {
  let log: DealEvent[] = [];
  for (const [i, [from, to]] of pairs.entries()) {
    const r = applyEvent('commercial_poc', log, ev(`E${i}`, from, to));
    if (!r.ok) return r;
    log = r.events;
  }
  return { ok: true as const, events: log, duplicate: false };
}

describe('deal state machine (commercial_poc)', () => {
  it('walks the full POC path to paid', () => {
    const path: DealState[] = [
      'identified', 'qualified', 'introduction_requested', 'first_meeting',
      'proposal_shared', 'agreement_signed', 'poc_running', 'poc_completed', 'contract_signed', 'paid',
    ];
    const pairs = path.slice(1).map((to, i): [DealState, DealState] => [path[i], to]);
    const r = replay(pairs);
    expect(r.ok).toBe(true);
    if (r.ok) expect(deriveState(r.events)).toBe('paid');
  });

  it('rejects skipping a state', () => {
    const r = replay([['identified', 'first_meeting']]);
    expect(r).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' });
  });

  it('treats a retried event ID as a no-op, not an error', () => {
    const first = applyEvent('commercial_poc', [], ev('E1', 'identified', 'qualified'));
    if (!first.ok) throw new Error('setup failed');
    const retry = applyEvent('commercial_poc', first.events, ev('E1', 'identified', 'qualified'));
    expect(retry).toMatchObject({ ok: true, duplicate: true });
    if (retry.ok) expect(retry.events).toHaveLength(1);
  });

  it('rejects a second event that moves to the current state', () => {
    const r = replay([['identified', 'qualified'], ['qualified', 'qualified']]);
    expect(r).toMatchObject({ ok: false, code: 'DUPLICATE_EVENT' });
  });

  it('rejects the wrong from_state (a stale client)', () => {
    const first = applyEvent('commercial_poc', [], ev('E1', 'identified', 'qualified'));
    if (!first.ok) throw new Error('setup failed');
    const stale = applyEvent('commercial_poc', first.events, ev('E2', 'identified', 'qualified'));
    expect(stale).toMatchObject({ ok: false, code: 'INVALID_TRANSITION' });
  });

  it('allows closed_lost from any non-terminal state', () => {
    const r = replay([['identified', 'qualified'], ['qualified', 'closed_lost']]);
    expect(r.ok && deriveState(r.events)).toBe('closed_lost');
  });

  it('allows no moves out of a terminal state', () => {
    expect(allowedNext([], 'paid')).toEqual([]);
    expect(allowedNext([], 'closed_lost')).toEqual([]);
  });

  it('resumes a held deal only to the state it was in before the hold', () => {
    const r = replay([['identified', 'qualified'], ['qualified', 'on_hold']]);
    if (!r.ok) throw new Error('setup failed');
    expect(allowedNext(r.events, 'on_hold')).toEqual(['qualified', 'closed_lost']);
    expect(replay([['identified', 'qualified'], ['qualified', 'on_hold'], ['on_hold', 'introduction_requested']])).toMatchObject({
      ok: false,
      code: 'INVALID_TRANSITION',
    });
  });

  it('rejects the investment and market_entry tracks in P0', () => {
    const r = applyEvent('investment', [], ev('E1', 'identified', 'qualified'));
    expect(r).toMatchObject({ ok: false, code: 'TRACK_NOT_SUPPORTED' });
  });

  it('rejects verified evidence in P0, because no verification workflow exists', () => {
    const r = applyEvent('commercial_poc', [], ev('E1', 'identified', 'qualified', { evidence_status: 'verified_public' }));
    expect(r).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });
});
