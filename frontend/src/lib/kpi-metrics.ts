import type { Deal, DealEvent, DealState } from '@/types';

export interface FunnelStepMetric {
  numerator: number;
  denominator: number;
  rate_percent: number | null;
}

export interface SectorBreakdownItem {
  sector: string;
  total: number;
  activePocs: number;
  signedOrPaid: number;
}

export interface CountryBreakdownItem {
  country: string;
  total: number;
  activePocs: number;
  signedOrPaid: number;
}

export interface FunnelSummary {
  totalDeals: number;
  qualified: FunnelStepMetric;
  introduction_requested: FunnelStepMetric;
  first_meeting: FunnelStepMetric;
  poc_or_loi: FunnelStepMetric;
  signed_contract: FunnelStepMetric;
  paid: FunnelStepMetric;
  pocToPaidConversion: FunnelStepMetric;
  medianDaysToClose: number | null;
  closedDealsCount: number;
  marketsEnteredCount: number;
  activePocsCount: number;
  completedPocsCount: number;
  bySector: SectorBreakdownItem[];
  byCountry: CountryBreakdownItem[];
}

export function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function reached(events: DealEvent[], state: DealState): boolean {
  return events.some((e) => e.to_state === state);
}

function dealReachedAny(deal: Deal, states: DealState[]): boolean {
  if (states.includes(deal.state)) return true;
  return states.some((s) => reached(deal.events || [], s));
}

function makeMetric(numerator: number, denominator: number): FunnelStepMetric {
  return {
    numerator,
    denominator,
    rate_percent: percent(numerator, denominator),
  };
}

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return Math.round(sorted[mid] * 10) / 10;
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

export function computeFunnelMetrics(deals: Deal[]): FunnelSummary {
  const totalDeals = deals.length;

  const qualifiedDeals = deals.filter((d) =>
    dealReachedAny(d, [
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
    ])
  );
  const qualifiedCount = qualifiedDeals.length;

  const introDeals = qualifiedDeals.filter((d) =>
    dealReachedAny(d, [
      'introduction_requested',
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ])
  );

  const meetingDeals = qualifiedDeals.filter((d) =>
    dealReachedAny(d, [
      'first_meeting',
      'proposal_shared',
      'negotiation',
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ])
  );

  const pocOrLoiDeals = qualifiedDeals.filter((d) =>
    dealReachedAny(d, [
      'agreement_signed',
      'poc_running',
      'poc_completed',
      'contract_signed',
      'paid',
    ])
  );

  const signedDeals = qualifiedDeals.filter((d) =>
    dealReachedAny(d, ['contract_signed', 'paid'])
  );

  const paidDeals = qualifiedDeals.filter((d) => dealReachedAny(d, ['paid']));

  // POC -> Paid conversion strictly over completed POC deals
  const completedPocDeals = deals.filter((d) =>
    dealReachedAny(d, ['poc_completed', 'contract_signed', 'paid']) &&
    (reached(d.events || [], 'poc_completed') || d.state === 'poc_completed')
  );
  const completedPocToPaidDeals = completedPocDeals.filter((d) =>
    dealReachedAny(d, ['paid'])
  );

  // Median days from first qualified event to contract_signed or paid (only over completed deals, never mixing open deals)
  const closeDurationDays: number[] = [];
  for (const deal of signedDeals) {
    const events = deal.events || [];
    const qualEvent = events.find((e) => e.to_state === 'qualified');
    const closeEvent =
      events.find((e) => e.to_state === 'paid') ||
      events.find((e) => e.to_state === 'contract_signed');

    const startIso = qualEvent?.happened_at || deal.created_at;
    const endIso = closeEvent?.happened_at;

    if (startIso && endIso) {
      const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
      if (!Number.isNaN(diffMs) && diffMs >= 0) {
        closeDurationDays.push(diffMs / (1000 * 60 * 60 * 24));
      }
    }
  }

  // Markets entered: unique (startup_name, country) pairs with operational POC or signed/paid outcome
  const marketPairs = new Set<string>();
  for (const deal of deals) {
    if (
      dealReachedAny(deal, [
        'poc_running',
        'poc_completed',
        'contract_signed',
        'paid',
      ])
    ) {
      marketPairs.add(
        `${deal.startup_name.toLowerCase()}::${deal.country.toLowerCase()}`
      );
    }
  }

  const activePocsCount = deals.filter(
    (d) => d.state === 'poc_running' || d.state === 'agreement_signed'
  ).length;

  const sectorMap = new Map<string, SectorBreakdownItem>();
  const countryMap = new Map<string, CountryBreakdownItem>();

  for (const deal of deals) {
    const isActivePoc =
      deal.state === 'poc_running' || deal.state === 'agreement_signed';
    const isSignedOrPaid =
      deal.state === 'contract_signed' || deal.state === 'paid';

    const sec = sectorMap.get(deal.sector) || {
      sector: deal.sector,
      total: 0,
      activePocs: 0,
      signedOrPaid: 0,
    };
    sec.total += 1;
    if (isActivePoc) sec.activePocs += 1;
    if (isSignedOrPaid) sec.signedOrPaid += 1;
    sectorMap.set(deal.sector, sec);

    const ctry = countryMap.get(deal.country) || {
      country: deal.country,
      total: 0,
      activePocs: 0,
      signedOrPaid: 0,
    };
    ctry.total += 1;
    if (isActivePoc) ctry.activePocs += 1;
    if (isSignedOrPaid) ctry.signedOrPaid += 1;
    countryMap.set(deal.country, ctry);
  }

  return {
    totalDeals,
    qualified: makeMetric(qualifiedCount, totalDeals),
    introduction_requested: makeMetric(introDeals.length, qualifiedCount),
    first_meeting: makeMetric(meetingDeals.length, qualifiedCount),
    poc_or_loi: makeMetric(pocOrLoiDeals.length, qualifiedCount),
    signed_contract: makeMetric(signedDeals.length, qualifiedCount),
    paid: makeMetric(paidDeals.length, qualifiedCount),
    pocToPaidConversion: makeMetric(
      completedPocToPaidDeals.length,
      completedPocDeals.length
    ),
    medianDaysToClose: computeMedian(closeDurationDays),
    closedDealsCount: signedDeals.length,
    marketsEnteredCount: marketPairs.size,
    activePocsCount,
    completedPocsCount: completedPocDeals.length,
    bySector: Array.from(sectorMap.values()).sort((a, b) => b.total - a.total),
    byCountry: Array.from(countryMap.values()).sort((a, b) => b.total - a.total),
  };
}
