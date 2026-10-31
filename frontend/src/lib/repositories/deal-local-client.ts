import type {
  Deal,
  DealEvent,
  DealState,
  DealTrack,
  DemandBrief,
  FollowUpTask,
  POCPlan,
} from '@/types';
import { canTransitionDealState, getDealStateLabel } from '@/lib/deal-fsm';
import demoDealsData from '@/data/deals-demo.json';

export const STORAGE_KEY = 'bridgeai_v2_local_deals';

let memoryFallbackDeals: Deal[] = [];

function hasBrowserStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
}

export function getDemoCohortDeals(): Deal[] {
  return (demoDealsData as Deal[]).map((deal) => ({
    ...deal,
    data_status: 'synthetic_demo',
  }));
}

export function getLocalDeals(): Deal[] {
  if (!hasBrowserStorage()) {
    return [...memoryFallbackDeals];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Deal[];
  } catch {
    return [];
  }
}

function writeDealsToStorage(deals: Deal[]): Deal[] {
  memoryFallbackDeals = [...deals];
  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    } catch {
      // Ignore storage quota errors in restricted browser environments
    }
  }
  return deals;
}

export function saveLocalDeal(deal: Deal): Deal[] {
  const existing = getLocalDeals();
  const normalizedDeal: Deal = {
    ...deal,
    data_status: 'self_reported',
  };
  const index = existing.findIndex((d) => d.id === normalizedDeal.id);
  const updated =
    index >= 0
      ? existing.map((d, i) => (i === index ? normalizedDeal : d))
      : [normalizedDeal, ...existing];
  return writeDealsToStorage(updated);
}

export function createQualifiedDealFromMatch(params: {
  startupName: string;
  demand: DemandBrief;
  track?: DealTrack;
  pocPlan?: POCPlan;
  note?: string;
}): Deal {
  const now = new Date().toISOString();
  const existing = getLocalDeals();
  const existingForDemand = existing.find(
    (d) =>
      d.demand_id === params.demand.id &&
      d.startup_name.toLowerCase() === params.startupName.toLowerCase()
  );

  if (existingForDemand) {
    const updatedDeal: Deal = {
      ...existingForDemand,
      poc_plan: params.pocPlan ?? existingForDemand.poc_plan,
      last_event_at: now,
    };
    saveLocalDeal(updatedDeal);
    return updatedDeal;
  }

  const dealId = `LOCAL-DEAL-${Date.now()}`;
  const track: DealTrack =
    params.track ||
    (params.demand.demand_kind === 'vc_thesis'
      ? 'investment'
      : 'commercial_poc');

  const initialEvent: DealEvent = {
    id: `EVT-${Date.now()}`,
    deal_id: dealId,
    event_type: 'match_qualified',
    from_state: 'identified',
    to_state: 'qualified',
    happened_at: now,
    recorded_at: now,
    actor_id: 'demo_user',
    evidence_status: 'self_reported',
    note:
      params.note ||
      `Saved qualified match from Demand Board (${params.demand.buyer_name}). Draft outreach or POC plan does not mark deal as contacted.`,
  };

  const due30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const initialTask: FollowUpTask = {
    id: `TASK-${Date.now()}`,
    deal_id: dealId,
    title: `Schedule discovery scoping call with ${params.demand.buyer_name}`,
    due_at: due30,
    cadence_days: 30,
    status: 'pending',
  };

  const newDeal: Deal = {
    id: dealId,
    startup_name: params.startupName || 'Founder Startup',
    demand_id: params.demand.id,
    partner_name: params.demand.buyer_name,
    title: params.demand.title,
    country: params.demand.country,
    sector: params.demand.industry,
    track,
    state: 'qualified',
    data_status: 'self_reported',
    ai_followup_suggestion: `Deal saved at Qualified Match. Request an introduction or log your discovery call before advancing to First Meeting.`,
    poc_plan: params.pocPlan,
    events: [initialEvent],
    tasks: [initialTask],
    created_at: now,
    last_event_at: now,
  };

  saveLocalDeal(newDeal);
  return newDeal;
}

export function appendDealEvent(params: {
  dealId: string;
  toState: DealState;
  eventType?: string;
  note?: string;
  happenedAt?: string;
  actorId?: string;
}): { deal: Deal; deals: Deal[] } {
  const deals = getLocalDeals();
  const target = deals.find((d) => d.id === params.dealId);
  if (!target) {
    throw new Error(`Local deal not found: ${params.dealId}`);
  }

  if (!canTransitionDealState(target.track, target.state, params.toState)) {
    throw new Error(
      `Invalid state transition on track "${target.track}": cannot move directly from "${getDealStateLabel(
        target.state
      )}" (${target.state}) to "${getDealStateLabel(params.toState)}" (${
        params.toState
      }).`
    );
  }

  const now = new Date().toISOString();
  const happenedAt = params.happenedAt || now;
  const newEvent: DealEvent = {
    id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deal_id: target.id,
    event_type: params.eventType || `state_changed_to_${params.toState}`,
    from_state: target.state,
    to_state: params.toState,
    happened_at: happenedAt,
    recorded_at: now,
    actor_id: params.actorId || 'demo_user',
    evidence_status: 'self_reported',
    note: params.note,
  };

  const updatedDeal: Deal = {
    ...target,
    state: params.toState,
    events: [...(target.events || []), newEvent],
    last_event_at: happenedAt,
  };

  const updatedDeals = saveLocalDeal(updatedDeal);
  return { deal: updatedDeal, deals: updatedDeals };
}

export function addDealTask(params: {
  dealId: string;
  title: string;
  cadenceDays?: 30 | 90 | 180;
  dueAt?: string;
}): { deal: Deal; deals: Deal[] } {
  const deals = getLocalDeals();
  const target = deals.find((d) => d.id === params.dealId);
  if (!target) {
    throw new Error(`Local deal not found: ${params.dealId}`);
  }

  const cadence = params.cadenceDays || 30;
  const dueAt =
    params.dueAt ||
    new Date(Date.now() + cadence * 24 * 60 * 60 * 1000).toISOString();

  const newTask: FollowUpTask = {
    id: `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deal_id: target.id,
    title: params.title.trim(),
    due_at: dueAt,
    cadence_days: params.cadenceDays,
    status: 'pending',
  };

  const updatedDeal: Deal = {
    ...target,
    tasks: [...(target.tasks || []), newTask],
  };

  const updatedDeals = saveLocalDeal(updatedDeal);
  return { deal: updatedDeal, deals: updatedDeals };
}

export function toggleDealTask(
  dealId: string,
  taskId: string
): { deal: Deal; deals: Deal[] } {
  const deals = getLocalDeals();
  const target = deals.find((d) => d.id === dealId);
  if (!target) {
    throw new Error(`Local deal not found: ${dealId}`);
  }

  const updatedTasks = (target.tasks || []).map((t) =>
    t.id === taskId
      ? {
          ...t,
          status:
            t.status === 'completed'
              ? ('pending' as const)
              : ('completed' as const),
        }
      : t
  );

  const updatedDeal: Deal = {
    ...target,
    tasks: updatedTasks,
  };

  const updatedDeals = saveLocalDeal(updatedDeal);
  return { deal: updatedDeal, deals: updatedDeals };
}

export function resetLocalDeals(): void {
  memoryFallbackDeals = [];
  if (hasBrowserStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
}
