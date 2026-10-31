import { P0_EVIDENCE, type DealEvent, type DealState } from './schemas';
import type { ErrorCode } from './errors';

// Pure module, no I/O. The browser repo adapter and the server both import it.

export const COMMERCIAL_POC_PATH: DealState[] = [
  'identified', 'qualified', 'introduction_requested', 'first_meeting',
  'proposal_shared', 'agreement_signed', 'poc_running', 'poc_completed',
  'contract_signed', 'paid',
];

const TERMINAL: DealState[] = ['closed_lost', 'paid'];

export type FsmResult =
  | { ok: true; events: DealEvent[]; duplicate: boolean }
  | { ok: false; code: ErrorCode; message: string };

// The current state is derived from the log, never stored separately, so it cannot drift.
export function deriveState(events: DealEvent[]): DealState {
  return events.length ? events[events.length - 1].to_state : 'identified';
}

export function allowedNext(events: DealEvent[], current: DealState): DealState[] {
  if (current === 'on_hold') {
    // Resume only to the state the deal was in before the hold.
    const hold = [...events].reverse().find((e) => e.to_state === 'on_hold');
    return hold ? [hold.from_state, 'closed_lost'] : [];
  }
  if (TERMINAL.includes(current)) return [];
  const i = COMMERCIAL_POC_PATH.indexOf(current);
  const next = i >= 0 && i < COMMERCIAL_POC_PATH.length - 1 ? [COMMERCIAL_POC_PATH[i + 1]] : [];
  return [...next, 'closed_lost', 'on_hold'];
}

export function applyEvent(track: string, events: DealEvent[], event: DealEvent): FsmResult {
  if (track !== 'commercial_poc') {
    return { ok: false, code: 'TRACK_NOT_SUPPORTED', message: 'Only the commercial_poc track is supported in P0.' };
  }
  // Retrying the same event is safe and returns the existing log.
  if (events.some((e) => e.id === event.id)) return { ok: true, events, duplicate: true };
  if (!(P0_EVIDENCE as readonly string[]).includes(event.evidence_status)) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'P0 accepts only self_reported or synthetic_demo evidence.' };
  }
  const current = deriveState(events);
  if (event.from_state !== current) {
    return { ok: false, code: 'INVALID_TRANSITION', message: `Deal is in ${current}, not ${event.from_state}.` };
  }
  if (event.to_state === current) {
    return { ok: false, code: 'DUPLICATE_EVENT', message: `Deal is already in ${current}.` };
  }
  if (!allowedNext(events, current).includes(event.to_state)) {
    return { ok: false, code: 'INVALID_TRANSITION', message: `Cannot move from ${current} to ${event.to_state}.` };
  }
  return { ok: true, events: [...events, event], duplicate: false };
}
