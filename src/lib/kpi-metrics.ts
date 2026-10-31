import type { DealEvent, DealState } from './schemas';

// Pure functions. Each deal is one event log. Real and synthetic deals are counted separately.

export function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function reached(events: DealEvent[], state: DealState): boolean {
  return events.some((e) => e.to_state === state);
}

export function isSynthetic(events: DealEvent[]): boolean {
  return events.some((e) => e.evidence_status === 'synthetic_demo');
}

export function splitBySource(logs: DealEvent[][]) {
  return {
    real: logs.filter((l) => !isSynthetic(l)),
    synthetic: logs.filter(isSynthetic),
  };
}

// Cohort = deals that reached `from`. Numerator = those that also reached `to`.
export function conversion(logs: DealEvent[][], from: DealState, to: DealState) {
  const cohort = logs.filter((l) => reached(l, from));
  const numerator = cohort.filter((l) => reached(l, to)).length;
  return { numerator, denominator: cohort.length, rate_percent: percent(numerator, cohort.length) };
}

export function funnel(logs: DealEvent[][]) {
  const count = (state: DealState) => logs.filter((l) => reached(l, state)).length;
  return {
    qualified: count('qualified'),
    introduction_requested: count('introduction_requested'),
    first_meeting: count('first_meeting'),
  };
}

// Days from first `qualified` to `paid`. Open deals are reported as in progress, never averaged in.
export function timeToClose(logs: DealEvent[][]) {
  const days: number[] = [];
  let inProgress = 0;
  for (const l of logs) {
    const q = l.find((e) => e.to_state === 'qualified');
    const p = l.find((e) => e.to_state === 'paid');
    if (q && p) days.push((Date.parse(p.happened_at) - Date.parse(q.happened_at)) / 86_400_000);
    else if (!reached(l, 'closed_lost')) inProgress++;
  }
  const average = days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null;
  return { average_days: average, completed: days.length, in_progress: inProgress };
}
