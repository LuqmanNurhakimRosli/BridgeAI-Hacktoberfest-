export type SourceStatus =
  | 'synthetic_demo'
  | 'self_reported'
  | 'verified_public'
  | 'verified_private';

export type DemandKind = 'corporate_challenge' | 'vc_thesis';
export type DealTrack = 'commercial_poc' | 'investment' | 'market_entry';

export type DealState =
  | 'identified'
  | 'qualified'
  | 'introduction_requested'
  | 'first_meeting'
  | 'proposal_shared'
  | 'negotiation'
  | 'agreement_signed'
  | 'poc_running'
  | 'poc_completed'
  | 'contract_signed'
  | 'paid'
  | 'closed_lost'
  | 'on_hold';

export type StartupStage = 'Idea' | 'Pre-seed' | 'Seed' | 'Series A' | 'Growth';
export type PrimaryGoal =
  | 'Investment'
  | 'Pilot Partnership'
  | 'Market Expansion'
  | 'Accelerator';

export interface StartupProfile {
  startup_name: string | null;
  description: string;
  industry: string | null;
  home_country: string | null;
  target_country: string | null;
  stage: StartupStage | null;
  product: string | null;
  primary_goal: PrimaryGoal | null;
  needs: string[];
  capability_tags?: string[];
  missing_fields: string[];
  confidence_notes: string[];
}

export interface Opportunity {
  id: string;
  name: string;
  country: string;
  type: 'Investor' | 'Corporate Pilot' | 'Accelerator' | 'Market Partner';
  industries: string[];
  stages: string[];
  goals: string[];
  description: string;
  eligibility_notes?: string[];
  source_url?: string | null;
  data_status: SourceStatus | 'fictional_demo';
  last_verified_at?: string | null;
}

export interface DemandBrief {
  id: string;
  demand_kind: DemandKind;
  buyer_name: string;
  title: string;
  country: string;
  industry: string;
  problem: string;
  must_have: string[];
  nice_to_have: string[];
  stages: StartupStage[];
  goals: PrimaryGoal[];
  budget_range?: { min?: number; max?: number; currency: string } | null;
  deadline_label?: string | null;
  data_status: SourceStatus;
  source_url?: string | null;
  last_verified_at?: string | null;
  eligibility_notes?: string[];
}

export interface ReverseMatch {
  demand_id: string;
  demand: DemandBrief;
  score: number;
  score_label: string;
  hard_eligibility: 'passed' | 'needs_verification' | 'ineligible';
  reasons: string[];
  unknowns: string[];
  ai_analysis?: {
    why_match: string;
    potential_collaboration: string;
    fit_gaps: string[];
    next_action: string;
  };
  data_status: SourceStatus;
  ai_source?: 'gemma_live' | 'demo_fixture';
}

export interface POCMilestone {
  phase: string;
  window_label: string;
  day: number;
  action: string;
  owner: 'startup' | 'partner' | 'joint';
  deliverables: string[];
}

export interface POCSuccessCriterion {
  metric: string;
  target: string;
  validation_method: string;
}

export interface POCPlan {
  deal_id: string;
  demand_id: string;
  title: string;
  partner_name: string;
  startup_name: string;
  country: string;
  sector: string;
  status: 'proposed' | 'under_review' | 'agreed' | 'running' | 'completed';
  proposed_duration_days: number;
  objective: string;
  proposed_scope: string;
  target_users_label: string;
  estimated_budget_note: string;
  milestones: POCMilestone[];
  success_criteria: POCSuccessCriterion[];
  preconditions: string[];
  ip_questions: string[];
  data_sharing_questions: string[];
  liability_questions: string[];
  possible_conversion_to_paid: string;
  outreach_email: {
    language: 'English' | 'Bahasa Melayu' | 'Bahasa Indonesia';
    subject: string;
    body: string;
  };
  ai_source: 'gemma_live' | 'demo_fixture';
}

export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: string;
  from_state: DealState;
  to_state: DealState;
  happened_at: string;
  recorded_at: string;
  actor_id: string;
  evidence_status: SourceStatus;
  note?: string;
  evidence_ref?: string | null;
}

export interface FollowUpTask {
  id: string;
  deal_id: string;
  title: string;
  due_at: string;
  cadence_days?: 30 | 90 | 180;
  status: 'pending' | 'completed' | 'dismissed';
}

export interface Deal {
  id: string;
  startup_name: string;
  demand_id: string;
  partner_name: string;
  title: string;
  country: string;
  sector: string;
  track: DealTrack;
  state: DealState;
  data_status: SourceStatus;
  ai_followup_suggestion?: string;
  poc_plan?: POCPlan;
  events: DealEvent[];
  tasks: FollowUpTask[];
  created_at: string;
  last_event_at: string;
}

export interface ReadinessChecklistItem {
  id: string;
  category:
    | 'Financials'
    | 'Traction & Metrics'
    | 'Product Deck'
    | 'Legal & Governance Docs'
    | 'Team Information';
  title: string;
  description: string;
  status: 'ready' | 'in_progress' | 'missing';
  verification_note: string;
}

export interface DealRoomDocMetadata {
  id: string;
  filename: string;
  category: string;
  access_policy: 'metadata_only_demo' | 'request_required' | 'shared_preview';
  verification_status: SourceStatus;
  updated_at: string;
  size_label: string;
  security_notice: string;
}
