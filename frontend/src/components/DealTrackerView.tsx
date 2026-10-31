'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, CircleAlert, Clock, Copy, Plus, Sparkles } from 'lucide-react';
import type { Deal, DealState, FollowUpTask } from '@/types';
import { canTransitionDealState, getAllowedNextStates, getDealStateLabel } from '@/lib/deal-fsm';
import { reached } from '@/lib/kpi-metrics';
import { ProvenanceBadge } from './ProvenanceBadge';
import { KokoroTtsButton } from './KokoroTtsButton';
import { Button, Chip, EmptyState, FilterChip, Panel, Segmented, countryCode, inputClass, type ChipTone } from './ui';

export interface DealTrackerViewProps {
  localDeals: Deal[];
  demoDeals: Deal[];
  onTransitionDeal: (dealId: string, toState: DealState, note: string) => void;
  onAddTask: (dealId: string, title: string, cadenceDays: 30 | 90 | 180) => void;
  onToggleTask: (dealId: string, taskId: string) => void;
  onOpenChallenges: () => void;
}

type Source = 'mine' | 'demo';

/* The five milestones a founder cares about, in order. */
const STAGE_TRACK: Array<{ label: string; states: DealState[] }> = [
  { label: 'Qualified', states: ['qualified'] },
  { label: 'Intro', states: ['introduction_requested'] },
  { label: 'Meeting', states: ['first_meeting', 'proposal_shared', 'negotiation'] },
  { label: 'Pilot', states: ['agreement_signed', 'poc_running', 'poc_completed'] },
  { label: 'Signed', states: ['contract_signed', 'paid'] },
];

const CLOSED_STATES: DealState[] = ['contract_signed', 'paid', 'closed_lost'];

function stageTone(state: DealState): ChipTone {
  if (state === 'paid' || state === 'contract_signed') return 'jade';
  if (state === 'closed_lost') return 'risk';
  if (state === 'on_hold') return 'amber';
  return 'ink';
}

function stageIndex(deal: Deal): number {
  let idx = -1;
  STAGE_TRACK.forEach((step, i) => {
    if (step.states.includes(deal.state) || step.states.some((s) => reached(deal.events || [], s))) idx = i;
  });
  return idx;
}

function daysUntil(iso: string): number {
  const due = new Date(iso);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function dueLabel(iso: string): { text: string; tone: ChipTone } {
  const d = daysUntil(iso);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, tone: 'risk' };
  if (d === 0) return { text: 'Due today', tone: 'amber' };
  if (d <= 7) return { text: `Due in ${d}d`, tone: 'amber' };
  return {
    text: new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    tone: 'neutral',
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso.slice(0, 10)
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function DealTrackerView({
  localDeals,
  demoDeals,
  onTransitionDeal,
  onAddTask,
  onToggleTask,
  onOpenChallenges,
}: DealTrackerViewProps) {
  const [source, setSource] = useState<Source>(localDeals.length > 0 ? 'mine' : 'demo');
  const [openId, setOpenId] = useState<string | null>(null);
  const deals = source === 'mine' ? localDeals : demoDeals;

  const active = deals.filter((d) => !CLOSED_STATES.includes(d.state));
  const closed = deals.filter((d) => CLOSED_STATES.includes(d.state));

  const attention = useMemo(
    () =>
      deals
        .flatMap((deal) =>
          deal.tasks.filter((t) => t.status === 'pending').map((task) => ({ deal, task }))
        )
        .sort((a, b) => a.task.due_at.localeCompare(b.task.due_at))
        .slice(0, 5),
    [deals]
  );

  const signedCount = deals.filter((d) => d.state === 'contract_signed' || d.state === 'paid').length;

  return (
    <section aria-label="Deals" className="space-y-6">
      <div className="space-y-3">
        <div role="group" aria-label="Deal source" className="flex flex-wrap gap-2">
          {(
            [
              { id: 'mine', label: `My deals (${localDeals.length})` },
              { id: 'demo', label: `Demo examples (${demoDeals.length})` },
            ] as const
          ).map((opt) => (
            <FilterChip
              key={opt.id}
              active={source === opt.id}
              onClick={() => {
                setSource(opt.id);
                setOpenId(null);
              }}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
        <p className="text-sm text-muted">
          {source === 'mine'
            ? 'Saved in this browser only. Stages change only when you record them.'
            : 'Sample deals that show how a pipeline grows. They are not real partnerships.'}
        </p>
        {deals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Chip>{active.length} active</Chip>
            <Chip tone={attention.length ? 'amber' : 'neutral'}>{attention.length} follow-ups pending</Chip>
            <Chip tone={signedCount ? 'jade' : 'neutral'}>{signedCount} signed or paid</Chip>
          </div>
        ) : null}
      </div>

      {deals.length === 0 ? (
        <EmptyState
          title="No saved deals yet"
          body="Pick a challenge, check your fit and save it. You can then track each conversation and set reminders here."
          action={<Button onClick={onOpenChallenges}>Find a challenge</Button>}
        />
      ) : (
        <>
          {/* What needs doing */}
          <section aria-labelledby="deals-attention" className="space-y-2.5">
            <h2 id="deals-attention" className="text-base font-bold text-ink">Needs your attention</h2>
            {attention.length === 0 ? (
              <p className="rounded-2xl bg-surface p-4 text-sm text-muted shadow-card">
                No follow-ups pending. Open a deal to add a reminder.
              </p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-card">
                {attention.map(({ deal, task }) => {
                  const due = dueLabel(task.due_at);
                  return (
                    <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Mark "${task.title}" done`}
                        onChange={() => onToggleTask(deal.id, task.id)}
                        className="h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                      />
                      <button
                        type="button"
                        onClick={() => setOpenId(deal.id)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span className="block truncate text-sm font-semibold text-ink">{task.title}</span>
                        <span className="block truncate text-xs text-muted">{deal.partner_name}</span>
                      </button>
                      <Chip tone={due.tone} icon={<Clock className="h-3 w-3" aria-hidden="true" />}>
                        {due.text}
                      </Chip>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="deals-active" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 id="deals-active" className="text-base font-bold text-ink">Active</h2>
              <Button variant="ghost" size="sm" onClick={onOpenChallenges} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Add from challenges
              </Button>
            </div>
            {active.length === 0 ? (
              <p className="text-sm text-muted">No active deals.</p>
            ) : (
              <ul className="space-y-3">
                {active.map((deal) => (
                  <li key={deal.id}>
                    <DealCard
                      deal={deal}
                      open={openId === deal.id}
                      onToggle={() => setOpenId(openId === deal.id ? null : deal.id)}
                      onTransitionDeal={onTransitionDeal}
                      onAddTask={onAddTask}
                      onToggleTask={onToggleTask}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {closed.length > 0 ? (
            <section aria-labelledby="deals-closed" className="space-y-2.5">
              <h2 id="deals-closed" className="text-base font-bold text-ink">Signed and closed</h2>
              <ul className="space-y-3">
                {closed.map((deal) => (
                  <li key={deal.id}>
                    <DealCard
                      deal={deal}
                      open={openId === deal.id}
                      onToggle={() => setOpenId(openId === deal.id ? null : deal.id)}
                      onTransitionDeal={onTransitionDeal}
                      onAddTask={onAddTask}
                      onToggleTask={onToggleTask}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function StageTrack({ deal }: { deal: Deal }) {
  const current = stageIndex(deal);
  const lost = deal.state === 'closed_lost';
  return (
    <ol className="flex items-center gap-1" aria-label={`Stage: ${getDealStateLabel(deal.state)}`}>
      {STAGE_TRACK.map((step, i) => (
        <li key={step.label} className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`h-1.5 rounded-full ${
              i <= current ? (lost ? 'bg-risk/60' : 'bg-jade-bright') : 'bg-ink/10'
            }`}
          />
          <span className={`truncate text-[11px] font-medium ${i === current ? 'text-ink' : 'text-muted/80'}`}>
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DealCard({
  deal,
  open,
  onToggle,
  onTransitionDeal,
  onAddTask,
  onToggleTask,
}: {
  deal: Deal;
  open: boolean;
  onToggle: () => void;
  onTransitionDeal: DealTrackerViewProps['onTransitionDeal'];
  onAddTask: DealTrackerViewProps['onAddTask'];
  onToggleTask: DealTrackerViewProps['onToggleTask'];
}) {
  const [nextState, setNextState] = useState<DealState | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [cadence, setCadence] = useState<'30' | '90' | '180'>('30');
  const [copied, setCopied] = useState(false);

  const allowed = getAllowedNextStates(deal.track, deal.state);
  const nextTask: FollowUpTask | undefined = deal.tasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const followup =
    deal.ai_followup_suggestion ||
    `Send ${deal.partner_name} a short progress note and suggest a time to agree the next step.`;

  const record = () => {
    if (!nextState) return;
    if (!canTransitionDealState(deal.track, deal.state, nextState)) {
      setError(`You can't move from ${getDealStateLabel(deal.state)} to ${getDealStateLabel(nextState)}.`);
      return;
    }
    onTransitionDeal(deal.id, nextState, note.trim() || `Moved to ${getDealStateLabel(nextState)}`);
    setNextState(null);
    setNote('');
    setError(null);
  };

  const copyFollowup = async () => {
    try {
      await navigator.clipboard?.writeText(followup);
    } catch {
      // Clipboard may be blocked; text remains visible.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const addTask = () => {
    const days = Number(cadence) as 30 | 90 | 180;
    onAddTask(deal.id, taskTitle.trim() || `Check in with ${deal.partner_name}`, days);
    setTaskTitle('');
  };

  return (
    <article data-testid={`deal-card-${deal.id}`} className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-testid={`toggle-workspace-${deal.id}`}
        className="block w-full space-y-3 p-4 text-left transition-colors hover:bg-paper/60 sm:p-5 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-sm font-extrabold text-ink">
            {countryCode(deal.country)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-bold text-ink">{deal.partner_name}</h3>
            <p className="truncate text-sm text-muted">{deal.title}</p>
          </div>
          <ChevronDown
            className={`mt-1 h-5 w-5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>
        <StageTrack deal={deal} />
        <div className="flex flex-wrap items-center gap-2">
          <span data-testid={`deal-state-badge-${deal.id}`}>
            <Chip tone={stageTone(deal.state)}>{getDealStateLabel(deal.state)}</Chip>
          </span>
          {nextTask ? (
            <Chip tone={dueLabel(nextTask.due_at).tone} icon={<Clock className="h-3 w-3" aria-hidden="true" />}>
              {dueLabel(nextTask.due_at).text}
            </Chip>
          ) : null}
          <ProvenanceBadge status={deal.data_status} />
        </div>
      </button>

      {open ? (
        <div className="space-y-5 border-t border-line bg-paper/50 p-4 sm:p-5">
          {/* Update stage */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-ink">Update stage</h4>
            {allowed.length === 0 ? (
              <p className="text-sm text-muted">This deal is closed. Its history is kept below.</p>
            ) : (
              <>
                <p className="text-xs text-muted">Pick what actually happened. AI never moves a deal for you.</p>
                <div className="flex flex-wrap gap-2">
                  {allowed.map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={nextState === st}
                      onClick={() => setNextState(nextState === st ? null : st)}
                      className={`min-h-[40px] rounded-full px-3.5 text-sm font-semibold cursor-pointer ${
                        nextState === st
                          ? 'bg-ink text-white'
                          : st === 'closed_lost'
                          ? 'bg-surface text-risk shadow-card hover:bg-risk-wash'
                          : 'bg-surface text-ink shadow-card hover:bg-paper'
                      }`}
                    >
                      {getDealStateLabel(st)}
                    </button>
                  ))}
                </div>
                {nextState ? (
                  <div className="space-y-2">
                    <input
                      aria-label="What happened"
                      className={inputClass}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What happened? e.g. Intro call with innovation lead"
                    />
                    <Button onClick={record} data-testid={`confirm-transition-btn-${deal.id}`}>
                      Record: {getDealStateLabel(nextState)}
                    </Button>
                  </div>
                ) : null}
                {error ? (
                  <p role="alert" className="flex items-center gap-1.5 text-sm text-risk">
                    <CircleAlert className="h-4 w-4" aria-hidden="true" />
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* AI suggestion */}
          <Panel as="div" className="space-y-3 p-4 sm:p-4" data-testid={`ai-followup-banner-${deal.id}`}>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-ai">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Suggested follow-up
            </h4>
            <p className="text-sm leading-relaxed text-ink">{followup}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyFollowup}
                data-testid={`copy-followup-btn-${deal.id}`}
                icon={copied ? <Check className="h-4 w-4 text-jade" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <KokoroTtsButton label="Listen" text={followup} />
            </div>
          </Panel>

          {/* Reminders */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-ink">Reminders</h4>
            {deal.tasks.length > 0 ? (
              <ul className="space-y-1.5">
                {deal.tasks.map((task) => {
                  const done = task.status === 'completed';
                  return (
                    <li key={task.id}>
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-surface px-3 shadow-card">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => onToggleTask(deal.id, task.id)}
                          className="h-5 w-5 shrink-0 accent-[var(--color-jade)]"
                        />
                        <span className={`min-w-0 flex-1 truncate text-sm ${done ? 'text-muted line-through' : 'text-ink'}`}>
                          {task.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{formatDate(task.due_at)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">No reminders yet.</p>
            )}
            <div className="space-y-2 pt-1">
              <input
                aria-label={`New reminder for ${deal.partner_name}`}
                className={inputClass}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a reminder"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  label="Remind me in"
                  value={cadence}
                  onChange={setCadence}
                  options={[
                    { id: '30', label: '30 days' },
                    { id: '90', label: '90 days' },
                    { id: '180', label: '180 days' },
                  ]}
                />
                <Button onClick={addTask} data-testid={`add-task-btn-${deal.id}`} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2.5" data-testid={`activity-timeline-${deal.id}`}>
            <h4 className="text-sm font-bold text-ink">History</h4>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {[...deal.events].reverse().map((evt) => (
                <li key={evt.id} className="relative text-sm">
                  <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-jade-bright ring-2 ring-paper" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-semibold text-ink">{getDealStateLabel(evt.to_state)}</span>
                    <span className="text-xs text-muted">{formatDate(evt.happened_at)}</span>
                  </div>
                  {evt.note ? <p className="text-muted">{evt.note}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default DealTrackerView;
