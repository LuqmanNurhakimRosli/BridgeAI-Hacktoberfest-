import type { DealState, DealTrack } from '@/types';

const TRANSITION_MAP: Record<DealTrack, Record<DealState, DealState[]>> = {
  commercial_poc: {
    identified: ['qualified', 'on_hold', 'closed_lost'],
    qualified: ['introduction_requested', 'on_hold', 'closed_lost'],
    introduction_requested: ['first_meeting', 'on_hold', 'closed_lost'],
    first_meeting: ['proposal_shared', 'negotiation', 'on_hold', 'closed_lost'],
    proposal_shared: ['negotiation', 'agreement_signed', 'on_hold', 'closed_lost'],
    negotiation: ['agreement_signed', 'on_hold', 'closed_lost'],
    agreement_signed: ['poc_running', 'contract_signed', 'on_hold', 'closed_lost'],
    poc_running: ['poc_completed', 'on_hold', 'closed_lost'],
    poc_completed: ['contract_signed', 'on_hold', 'closed_lost'],
    contract_signed: ['paid', 'on_hold', 'closed_lost'],
    paid: [],
    on_hold: [
      'qualified',
      'introduction_requested',
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'closed_lost',
    ],
    closed_lost: [],
  },
  investment: {
    identified: ['qualified', 'on_hold', 'closed_lost'],
    qualified: ['introduction_requested', 'on_hold', 'closed_lost'],
    introduction_requested: ['first_meeting', 'on_hold', 'closed_lost'],
    first_meeting: ['proposal_shared', 'negotiation', 'on_hold', 'closed_lost'],
    proposal_shared: ['negotiation', 'on_hold', 'closed_lost'],
    negotiation: ['agreement_signed', 'contract_signed', 'on_hold', 'closed_lost'],
    agreement_signed: ['contract_signed', 'paid', 'on_hold', 'closed_lost'],
    poc_running: ['poc_completed', 'on_hold', 'closed_lost'],
    poc_completed: ['contract_signed', 'on_hold', 'closed_lost'],
    contract_signed: ['paid', 'on_hold', 'closed_lost'],
    paid: [],
    on_hold: [
      'qualified',
      'introduction_requested',
      'first_meeting',
      'negotiation',
      'closed_lost',
    ],
    closed_lost: [],
  },
  market_entry: {
    identified: ['qualified', 'on_hold', 'closed_lost'],
    qualified: ['introduction_requested', 'on_hold', 'closed_lost'],
    introduction_requested: ['first_meeting', 'on_hold', 'closed_lost'],
    first_meeting: [
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'on_hold',
      'closed_lost',
    ],
    proposal_shared: ['negotiation', 'agreement_signed', 'on_hold', 'closed_lost'],
    negotiation: ['agreement_signed', 'contract_signed', 'on_hold', 'closed_lost'],
    agreement_signed: ['poc_running', 'contract_signed', 'paid', 'on_hold', 'closed_lost'],
    poc_running: ['poc_completed', 'on_hold', 'closed_lost'],
    poc_completed: ['contract_signed', 'on_hold', 'closed_lost'],
    contract_signed: ['paid', 'on_hold', 'closed_lost'],
    paid: [],
    on_hold: [
      'qualified',
      'introduction_requested',
      'first_meeting',
      'negotiation',
      'closed_lost',
    ],
    closed_lost: [],
  },
};

export const DEAL_STATE_LABELS: Record<DealState, string> = {
  identified: 'Identified',
  qualified: 'Qualified Match',
  introduction_requested: 'Intro Requested',
  first_meeting: 'First Meeting',
  proposal_shared: 'Proposal Shared',
  negotiation: 'In Negotiation',
  agreement_signed: 'POC / Term Agreement Signed',
  poc_running: 'POC Running',
  poc_completed: 'POC Completed',
  contract_signed: 'Contract Signed',
  paid: 'Paid Outcome',
  closed_lost: 'Closed Lost',
  on_hold: 'On Hold',
};

export function getAllowedNextStates(
  track: DealTrack,
  current: DealState
): DealState[] {
  const trackMap = TRANSITION_MAP[track] || TRANSITION_MAP.commercial_poc;
  return trackMap[current] ? [...trackMap[current]] : [];
}

export function canTransitionDealState(
  track: DealTrack,
  from: DealState,
  to: DealState
): boolean {
  if (from === to) return false;
  const allowed = getAllowedNextStates(track, from);
  return allowed.includes(to);
}

export function getDealStateLabel(state: DealState): string {
  return DEAL_STATE_LABELS[state] || state;
}
