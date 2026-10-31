'use client';

import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  History,
  ListChecks,
  AlertCircle,
  Lock,
} from 'lucide-react';
import type { Deal, DealState } from '@/types';
import {
  DEAL_TRACK_LABELS,
  canTransitionDealState,
  getAllowedNextStates,
  getDealStateBadgeColor,
  getDealStateLabel,
} from '@/lib/deal-fsm';
import { reached } from '@/lib/kpi-metrics';
import { ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { getCountryFlag } from './DemandBoard';

export interface DealTrackerViewProps {
  localDeals: Deal[];
  demoDeals: Deal[];
  onTransitionDeal: (dealId: string, toState: DealState, note: string) => void;
  onAddTask: (
    dealId: string,
    title: string,
    cadenceDays: 30 | 90 | 180
  ) => void;
  onToggleTask: (dealId: string, taskId: string) => void;
  onOpenChallenges: () => void;
}

type SourceFilter = 'all' | 'local' | 'demo';
type TrackerSubTab = 'active' | 'followups' | 'closed';

const FUNNEL_CHEVRON_STEPS: Array<{
  id: string;
  label: string;
  states: DealState[];
  colorClasses: string;
}> = [
  {
    id: 'qualified',
    label: 'Qualified',
    states: [
      'qualified',
      'introduction_requested',
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ],
    colorClasses: 'bg-[#0F2D5B] text-white border-[#0F2D5B]',
  },
  {
    id: 'intro_requested',
    label: 'Intro Requested',
    states: [
      'introduction_requested',
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ],
    colorClasses: 'bg-blue-700 text-white border-blue-700',
  },
  {
    id: 'first_meeting',
    label: 'First Meeting',
    states: [
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ],
    colorClasses: 'bg-[#8B5CF6] text-white border-[#8B5CF6]',
  },
  {
    id: 'poc_loi',
    label: 'POC / LOI',
    states: [
      'proposal_shared',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ],
    colorClasses: 'bg-teal-600 text-white border-teal-600',
  },
  {
    id: 'signed_paid',
    label: 'Signed / Paid',
    states: ['contract_signed', 'paid'],
    colorClasses: 'bg-[#10B981] text-slate-950 border-[#10B981]',
  },
];

function dealReachedAnyState(deal: Deal, states: DealState[]): boolean {
  if (states.includes(deal.state)) return true;
  return states.some((s) => reached(deal.events || [], s));
}

function formatDateShort(iso?: string): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function DealTrackerView({
  localDeals,
  demoDeals,
  onTransitionDeal,
  onAddTask,
  onToggleTask,
  onOpenChallenges,
}: DealTrackerViewProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [subTab, setSubTab] = useState<TrackerSubTab>('active');
  const [expandedDealIds, setExpandedDealIds] = useState<Record<string, boolean>>({});
  const [selectedNextState, setSelectedNextState] = useState<
    Record<string, DealState>
  >({});
  const [transitionNotes, setTransitionNotes] = useState<Record<string, string>>(
    {}
  );
  const [transitionErrors, setTransitionErrors] = useState<
    Record<string, string | null>
  >({});
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});
  const [newTaskCadence, setNewTaskCadence] = useState<
    Record<string, 30 | 90 | 180>
  >({});
  const [copiedDealId, setCopiedDealId] = useState<string | null>(null);

  const sourceDeals = useMemo(() => {
    if (sourceFilter === 'local') return localDeals;
    if (sourceFilter === 'demo') return demoDeals;
    return [...localDeals, ...demoDeals];
  }, [sourceFilter, localDeals, demoDeals]);

  // 4 Top KPI Summary Tiles
  const totalTrackedCount = sourceDeals.length;
  const activeQualifiedOrPocCount = sourceDeals.filter(
    (d) =>
      ![
        'contract_signed',
        'paid',
        'closed_lost',
      ].includes(d.state)
  ).length;
  const pendingFollowupsCount = sourceDeals.reduce(
    (acc, d) =>
      acc + (d.tasks || []).filter((t) => t.status === 'pending').length,
    0
  );
  const signedOrPaidCount = sourceDeals.filter(
    (d) => d.state === 'contract_signed' || d.state === 'paid'
  ).length;

  // Sub-tab filtering
  const visibleDeals = useMemo(() => {
    if (subTab === 'closed') {
      return sourceDeals.filter((d) =>
        ['contract_signed', 'paid', 'closed_lost'].includes(d.state)
      );
    }
    if (subTab === 'followups') {
      return sourceDeals.filter((d) =>
        (d.tasks || []).some((t) => t.status === 'pending')
      );
    }
    return sourceDeals;
  }, [sourceDeals, subTab]);

  const isDealExpanded = (dealId: string, index: number): boolean => {
    if (expandedDealIds[dealId] !== undefined) {
      return expandedDealIds[dealId];
    }
    // Expand the first deal card by default so its workspace is immediately inspectable
    return index === 0;
  };

  const toggleExpandDeal = (dealId: string, index: number) => {
    const current = isDealExpanded(dealId, index);
    setExpandedDealIds((prev) => ({ ...prev, [dealId]: !current }));
  };

  const handleCopyFollowup = async (deal: Deal) => {
    const text =
      deal.ai_followup_suggestion ||
      `Follow up with ${deal.partner_name} on ${deal.title} (${getDealStateLabel(
        deal.state
      )}).`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Ignore clipboard error in headless environments
    }
    setCopiedDealId(deal.id);
    setTimeout(() => {
      setCopiedDealId((prev) => (prev === deal.id ? null : prev));
    }, 2500);
  };

  const handleConfirmTransition = (deal: Deal) => {
    const allowed = getAllowedNextStates(deal.track, deal.state);
    const targetState = selectedNextState[deal.id] || allowed[0];
    if (!targetState) return;

    if (!canTransitionDealState(deal.track, deal.state, targetState)) {
      setTransitionErrors((prev) => ({
        ...prev,
        [deal.id]: `Illegal state transition from ${getDealStateLabel(
          deal.state
        )} to ${getDealStateLabel(targetState)}.`,
      }));
      return;
    }

    const rawNote = (transitionNotes[deal.id] ?? '').trim();
    const effectiveNote =
      rawNote ||
      `Human-confirmed transition to ${getDealStateLabel(targetState)} with ${
        deal.partner_name
      }`;

    setTransitionErrors((prev) => ({ ...prev, [deal.id]: null }));
    onTransitionDeal(deal.id, targetState, effectiveNote);
    setTransitionNotes((prev) => ({ ...prev, [deal.id]: '' }));
  };

  const handleCreateTask = (deal: Deal, defaultCadence?: 30 | 90 | 180) => {
    const cadence = defaultCadence || newTaskCadence[deal.id] || 30;
    const rawTitle = (newTaskTitles[deal.id] || '').trim();
    const title =
      rawTitle ||
      `${cadence}-Day ${deal.partner_name} Milestone & Pilot Check-in`;

    onAddTask(deal.id, title, cadence);
    setNewTaskTitles((prev) => ({ ...prev, [deal.id]: '' }));
  };

  const primaryDealForCadence = visibleDeals[0] || sourceDeals[0] || null;

  return (
    <section
      aria-label="Deal Tracker and Post-Match CRM"
      className="mx-auto max-w-6xl space-y-6 pb-20"
    >
      {/* Local-Only Persistence Honesty Banner (Verbatim per Task 7 Brief) */}
      <div
        data-testid="deal-tracker-honesty-banner"
        className="rounded-2xl border border-amber-300/90 bg-amber-50/95 px-4 py-3.5 text-xs sm:text-sm font-semibold text-amber-950 shadow-2xs flex items-start gap-2.5"
      >
        <Lock className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <span>
          🔒 Browser LocalStorage Mode: Your saved deals and stage transitions are persisted locally on this device. Synthetic demo cohort records are badged separately.
        </span>
      </div>

      {/* Top Header + Source Filter Toggle */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#0F2D5B] sm:text-2xl">
            ASEAN Cross-Border Deal Tracker &amp; Activity CRM
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Event-sourced stage transitions controlled by explicit human confirmation — never auto-advanced by AI drafts.
          </p>
        </div>

        {/* Source Filter Toggle */}
        <div
          role="group"
          aria-label="Deal Source Cohort Filter"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1.5 border border-slate-200"
        >
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            data-testid="deal-source-all"
            className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-[#0F2D5B] text-white shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            All Deals (Local + Demo Cohort)
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('local')}
            data-testid="deal-source-local"
            className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'local'
                ? 'bg-[#10B981] text-slate-950 shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            {`My Saved Deals (${localDeals.length})`}
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('demo')}
            data-testid="deal-source-demo"
            className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'demo'
                ? 'bg-[#8B5CF6] text-white shadow-xs'
                : 'text-slate-700 hover:bg-white'
            }`}
          >
            {`Synthetic Demo Cohort (${demoDeals.length})`}
          </button>
        </div>
      </div>

      {/* 4 Top KPI Summary Tiles (2x2 on mobile, 4-col on desktop) */}
      <div
        aria-label="Deal Tracker Summary Tiles"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Tracked Deals
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0F2D5B]">
            {totalTrackedCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            {localDeals.length} Local Saved · {demoDeals.length} Synthetic Demo
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Qualified / POC Deals
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-violet-700">
            {activeQualifiedOrPocCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Qualified, Intro, Meeting &amp; Active POCs
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Follow-ups
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600">
            {pendingFollowupsCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            30 / 90 / 180-day scheduled check-ins
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Signed / Paid Outcomes
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#10B981]">
            {signedOrPaidCount}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Confirmed contracts &amp; settled invoices
          </p>
        </div>
      </div>

      {/* Horizontal Chevron Deal Funnel */}
      <div
        aria-label="Horizontal Chevron Deal Funnel"
        className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F2D5B]">
            Deal Progression Funnel (Cumulative Stage Reach)
          </h3>
          <span className="text-xs text-slate-500">
            Qualified → Intro Requested → First Meeting → POC / LOI → Signed / Paid
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {FUNNEL_CHEVRON_STEPS.map((step, idx) => {
            const count = sourceDeals.filter((d) =>
              dealReachedAnyState(d, step.states)
            ).length;
            return (
              <div
                key={step.id}
                data-testid={`funnel-chevron-${step.id}`}
                className={`relative flex items-center justify-between sm:flex-col sm:items-start sm:justify-center rounded-xl border px-3.5 py-3 shadow-2xs ${step.colorClasses}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold opacity-95">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[10px] font-extrabold">
                    {idx + 1}
                  </span>
                  <span>{step.label}</span>
                </div>
                <div className="mt-0 sm:mt-1.5 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-extrabold">
                    {count}
                  </span>
                  <span className="text-[11px] font-semibold opacity-85">
                    deals
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-tabs: Active Deals | Follow-ups & Check-ins | Closed / Paid */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div role="tablist" aria-label="Deal Tracker Sub-tabs" className="flex flex-wrap gap-2">
          {(
            [
              { id: 'active', label: 'Active Deals' },
              { id: 'followups', label: 'Follow-ups & Check-ins' },
              { id: 'closed', label: 'Closed / Paid' },
            ] as const
          ).map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setSubTab(tab.id)}
                data-testid={`tracker-subtab-${tab.id}`}
                className={`min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#0F2D5B] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenChallenges}
          data-testid="tracker-browse-challenges-btn"
          className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-950 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 text-emerald-700" />
          <span>Qualify New Challenge Match</span>
        </button>
      </div>

      {/* Deal Cards & Expandable Workspace */}
      {visibleDeals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No deals in this view yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Save a qualified match or generate a 75-day POC plan from the Challenges Board to track real stage transitions here.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenChallenges}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F2D5B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0A1E3F]"
          >
            <span>Explore Corporate Challenges</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleDeals.map((deal, idx) => {
            const expanded = isDealExpanded(deal.id, idx);
            const allowedNext = getAllowedNextStates(deal.track, deal.state);
            const currentSelectedNext =
              selectedNextState[deal.id] &&
              allowedNext.includes(selectedNextState[deal.id])
                ? selectedNextState[deal.id]
                : allowedNext[0];
            const nextPendingTask = (deal.tasks || []).find(
              (t) => t.status === 'pending'
            );
            const nextCheckInLabel = nextPendingTask
              ? formatDateShort(nextPendingTask.due_at)
              : 'No pending check-in';

            const aiFollowupText =
              deal.ai_followup_suggestion ||
              `Suggested Next Step: Share a concise progress note with ${deal.partner_name} and confirm readiness for ${
                currentSelectedNext
                  ? getDealStateLabel(currentSelectedNext)
                  : 'next milestone review'
              }.`;

            return (
              <article
                key={deal.id}
                data-testid={`deal-card-${deal.id}`}
                className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition hover:border-slate-300"
              >
                {/* Deal Card Summary Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F2D5B]">
                          {deal.partner_name}
                        </span>
                        <span className="text-xs text-slate-400">×</span>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                          {deal.startup_name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          <span>{getCountryFlag(deal.country)}</span>
                          <span>{deal.country}</span>
                        </span>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200/70">
                          {deal.sector}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {DEAL_TRACK_LABELS[deal.track]}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        {deal.title}
                      </h3>
                    </div>

                    {/* Right Badges: Current DealState + Provenance */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <span
                        data-testid={`deal-state-badge-${deal.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getDealStateBadgeColor(
                          deal.state
                        )}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                        <span>{getDealStateLabel(deal.state)}</span>
                      </span>

                      <ProvenanceBadge status={deal.data_status} size="sm" />
                    </div>
                  </div>

                  {/* Purple ✨ AI Follow-up Suggestion Banner */}
                  <div
                    data-testid={`ai-followup-banner-${deal.id}`}
                    className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-violet-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 text-xs text-violet-950">
                      <Sparkles className="h-4 w-4 shrink-0 text-[#8B5CF6] mt-0.5" />
                      <div>
                        <span className="font-extrabold text-violet-900">
                          ✨ AI Follow-up Suggestion:
                        </span>{' '}
                        <span className="text-violet-900/95 leading-relaxed">
                          {aiFollowupText}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <KokoroTtsButton
                        label="Listen"
                        text={`AI Follow-up Suggestion for ${deal.partner_name}: ${aiFollowupText}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyFollowup(deal)}
                        data-testid={`copy-followup-btn-${deal.id}`}
                        className="min-h-[38px] shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-300 bg-white hover:bg-violet-100/70 px-3 py-1.5 text-xs font-bold text-violet-900 transition cursor-pointer"
                      >
                        {copiedDealId === deal.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Copied Follow-up!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[#8B5CF6]" />
                            <span>📋 Copy Follow-up Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Footer & Expand Workspace Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Next Check-in:</span>
                        <strong className="text-slate-900">
                          {nextCheckInLabel}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <History className="h-3.5 w-3.5 text-slate-400" />
                        <span>{(deal.events || []).length} Recorded Events</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandDeal(deal.id, idx)}
                      data-testid={`toggle-workspace-${deal.id}`}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 text-xs font-bold text-[#0F2D5B] transition cursor-pointer"
                    >
                      <span>
                        {expanded ? 'Hide Deal Workspace' : 'Open Deal Workspace'}
                      </span>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Workspace: Human Stage Updater + ActivityTimeline + Tasks */}
                {expanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-6">
                    {/* Human-Controlled Stage Updater (deal-fsm.ts) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                          <h4 className="text-xs sm:text-sm font-extrabold text-[#0F2D5B]">
                            Human-Confirmed Stage Transition (FSM Guarded)
                          </h4>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          Track: {DEAL_TRACK_LABELS[deal.track]} · Current:{' '}
                          <strong>{getDealStateLabel(deal.state)}</strong>
                        </span>
                      </div>

                      {allowedNext.length === 0 ? (
                        <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          This deal has reached a terminal state ({getDealStateLabel(deal.state)}). All historical events are preserved below.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-4">
                            <label
                              htmlFor={`next-state-${deal.id}`}
                              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                            >
                              Legal Next Stage
                            </label>
                            <select
                              id={`next-state-${deal.id}`}
                              value={currentSelectedNext || ''}
                              onChange={(e) =>
                                setSelectedNextState((prev) => ({
                                  ...prev,
                                  [deal.id]: e.target.value as DealState,
                                }))
                              }
                              className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
                            >
                              {allowedNext.map((st) => (
                                <option key={st} value={st}>
                                  {getDealStateLabel(st)} ({st})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-5">
                            <label
                              htmlFor={`transition-note-${deal.id}`}
                              className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                            >
                              Human Confirmation Note *
                            </label>
                            <input
                              id={`transition-note-${deal.id}`}
                              type="text"
                              value={transitionNotes[deal.id] || ''}
                              onChange={(e) =>
                                setTransitionNotes((prev) => ({
                                  ...prev,
                                  [deal.id]: e.target.value,
                                }))
                              }
                              placeholder="Introductory call held with innovation lead"
                              className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0F2D5B] focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <button
                              type="button"
                              onClick={() => handleConfirmTransition(deal)}
                              data-testid={`confirm-transition-btn-${deal.id}`}
                              className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-xs transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Record Stage Event</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {transitionErrors[deal.id] ? (
                        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>{transitionErrors[deal.id]}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Two-Column Split: Timestamped ActivityTimeline + Deal Follow-up Tasks */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Timestamped ActivityTimeline (7 cols) */}
                      <div
                        data-testid={`activity-timeline-${deal.id}`}
                        className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#0F2D5B]">
                            <History className="h-4 w-4 text-indigo-600" />
                            <span>ActivityTimeline (Append-Only DealEvents)</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {(deal.events || []).length} events
                          </span>
                        </div>

                        <ol className="relative border-l-2 border-slate-200 ml-2.5 space-y-3 pl-4">
                          {(deal.events || []).map((evt) => (
                            <li key={evt.id} className="space-y-1 text-xs">
                              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#10B981]" />
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-bold text-slate-900">
                                  {getDealStateLabel(evt.from_state)} →{' '}
                                  <span className="text-[#0F2D5B]">
                                    {getDealStateLabel(evt.to_state)}
                                  </span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {formatDateShort(evt.happened_at)}
                                </span>
                              </div>
                              {evt.note ? (
                                <p className="text-slate-600 leading-relaxed">
                                  {evt.note}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                  {evt.from_state} → {evt.to_state}
                                </code>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  evidence: {evt.evidence_status}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Follow-up Tasks & Check-ins (5 cols) */}
                      <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#0F2D5B]">
                            <ListChecks className="h-4 w-4 text-emerald-600" />
                            <span>Follow-up Tasks &amp; Cadence</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {(deal.tasks || []).length} tasks
                          </span>
                        </div>

                        <ul className="space-y-2">
                          {(deal.tasks || []).map((task) => {
                            const done = task.status === 'completed';
                            return (
                              <li
                                key={task.id}
                                className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 text-xs ${
                                  done
                                    ? 'border-emerald-200 bg-emerald-50/50 text-slate-500 line-through'
                                    : 'border-slate-200 bg-slate-50/60 text-slate-800'
                                }`}
                              >
                                <label className="flex items-start gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() =>
                                      onToggleTask(deal.id, task.id)
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#10B981]"
                                  />
                                  <div>
                                    <div className="font-semibold">
                                      {task.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Due: {formatDateShort(task.due_at)}
                                      {task.cadence_days
                                        ? ` · ${task.cadence_days} Days`
                                        : ''}
                                    </div>
                                  </div>
                                </label>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Quick Add Task Form */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <input
                            type="text"
                            value={newTaskTitles[deal.id] || ''}
                            onChange={(e) =>
                              setNewTaskTitles((prev) => ({
                                ...prev,
                                [deal.id]: e.target.value,
                              }))
                            }
                            placeholder="Add follow-up check-in task..."
                            aria-label={`Add follow-up task for ${deal.partner_name}`}
                            className="w-full min-h-[38px] rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={newTaskCadence[deal.id] || 30}
                              aria-label={`Follow-up cadence for ${deal.partner_name}`}
                              onChange={(e) =>
                                setNewTaskCadence((prev) => ({
                                  ...prev,
                                  [deal.id]: Number(e.target.value) as
                                    | 30
                                    | 90
                                    | 180,
                                }))
                              }
                              className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                            >
                              <option value={30}>30 Days</option>
                              <option value={90}>90 Days</option>
                              <option value={180}>180 Days</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleCreateTask(deal)}
                              data-testid={`add-task-btn-${deal.id}`}
                              className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 rounded-lg bg-[#0F2D5B] hover:bg-[#0A1E3F] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Schedule Task</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom Upcoming Check-ins (30 Days / 90 Days / 180 Days Cadence Cards) */}
      <div
        aria-label="Upcoming Check-ins Cadence Cards"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-[#0F2D5B]">
              <Clock className="h-4 w-4 text-[#10B981]" />
              <span>Upcoming Check-ins (Post-Intro Accountability Cadence)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Standardized 30 / 90 / 180-day check-in milestones ensure cross-border pilots convert into audited outcomes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                days: 30 as const,
                label: '30 Days',
                title: 'Discovery & Pilot Protocol Check-in',
                desc: 'Verify initial discovery meeting, field data-consent sign-off, and sandbox deployment readiness.',
              },
              {
                days: 90 as const,
                label: '90 Days',
                title: '75-Day POC Pay / No-Pay Evaluation',
                desc: 'Audit field pilot precision/recall and operator satisfaction metrics against agreed target thresholds.',
              },
              {
                days: 180 as const,
                label: '180 Days',
                title: 'Commercial Rollout & Regional Expansion',
                desc: 'Track annual contract settlement, multi-site expansion, and cross-border market entry milestones.',
              },
            ] as const
          ).map((cadence) => (
            <div
              key={cadence.days}
              data-testid={`checkin-cadence-${cadence.days}`}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0F2D5B] px-2.5 py-0.5 text-xs font-extrabold text-white">
                    {cadence.label}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Post-Match Cadence
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {cadence.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cadence.desc}
                </p>
              </div>

              {primaryDealForCadence ? (
                <button
                  type="button"
                  onClick={() =>
                    onAddTask(
                      primaryDealForCadence.id,
                      `${cadence.label}: ${cadence.title}`,
                      cadence.days
                    )
                  }
                  className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#0F2D5B] transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#10B981]" />
                  <span>+ Add {cadence.label} Check-in</span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DealTrackerView;
