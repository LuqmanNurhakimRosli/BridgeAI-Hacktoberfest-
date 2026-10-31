'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type {
  Deal,
  DealState,
  DemandBrief,
  POCPlan,
  ReverseMatch,
  StartupProfile,
} from '@/types';
import demandBriefsData from '@/data/demand-briefs.json';
import { rankDemandMatches } from '@/lib/demand-matcher';
import { toRequestProfile } from '@/lib/contract';
import { getDealStateLabel } from '@/lib/deal-fsm';
import {
  addDealTask,
  appendDealEvent,
  createQualifiedDealFromMatch,
  getDemoCohortDeals,
  getLocalDeals,
  saveLocalDeal,
  toggleDealTask,
} from '@/lib/repositories/deal-local-client';
import { AppShell, type NavTab } from '@/components/AppShell';
import { HomeGateway } from '@/components/HomeGateway';
import {
  AGRISMART_PRESET,
  StartupPassportFlow,
} from '@/components/StartupPassportFlow';
import { DemandBoard } from '@/components/DemandBoard';
import { ReverseMatchDetail } from '@/components/ReverseMatchDetail';
import {
  PilotPlanEditor,
  buildDefaultPocPlan,
} from '@/components/PilotPlanEditor';
import { DealTrackerView } from '@/components/DealTrackerView';
import { OutcomeAnalyticsView } from '@/components/OutcomeAnalyticsView';
import { InvestorReadinessView } from '@/components/InvestorReadinessView';
import { Segmented } from '@/components/ui';

type ChallengeSubView = 'list' | 'detail' | 'poc';
type DealsView = 'pipeline' | 'outcomes';
type ProfileView = 'passport' | 'readiness';

const DISCOVER_STEPS: Array<{ id: ChallengeSubView; label: string }> = [
  { id: 'list', label: 'Choose a challenge' },
  { id: 'detail', label: 'Check your fit' },
  { id: 'poc', label: 'Draft a pilot' },
];

export default function BridgeAiMainPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [challengeSubView, setChallengeSubView] =
    useState<ChallengeSubView>('list');
  const [dealsView, setDealsView] = useState<DealsView>('pipeline');
  const [profileView, setProfileView] = useState<ProfileView>('passport');

  const [profile, setProfile] = useState<StartupProfile>(AGRISMART_PRESET);
  const [isPassportConfirmed, setIsPassportConfirmed] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<'gemma_live' | 'demo_fixture'>(
    'demo_fixture'
  );
  const [aiModel, setAiModel] = useState<string | undefined>(
    'google/gemma-4-26b-a4b-it'
  );

  const [demands, setDemands] = useState<DemandBrief[]>(
    () => demandBriefsData as DemandBrief[]
  );
  const [matches, setMatches] = useState<ReverseMatch[]>(() =>
    rankDemandMatches(AGRISMART_PRESET, demandBriefsData as DemandBrief[])
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string>('DEMO-CH-001');
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(false);

  const [localDeals, setLocalDeals] = useState<Deal[]>([]);
  const [demoDeals] = useState<Deal[]>(() => getDemoCohortDeals());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalDeals(getLocalDeals());
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab, challengeSubView, dealsView, profileView]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const selectedMatch: ReverseMatch = useMemo(() => {
    return (
      matches.find((m) => m.demand_id === selectedMatchId) ||
      matches[0] ||
      rankDemandMatches(profile, demands)[0]
    );
  }, [matches, selectedMatchId, profile, demands]);

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'discover') {
      setChallengeSubView('list');
    }
  };

  const refreshDemandMatches = async (targetProfile: StartupProfile) => {
    setIsLoadingMatches(true);
    const localRanked = rankDemandMatches(targetProfile, demands);
    setMatches(localRanked);

    try {
      const response = await fetch('/api/demand/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_profile: toRequestProfile(targetProfile) }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.matches) && data.matches.length > 0) {
          const demandMap = new Map(demands.map((d: any) => [d.id, d]));
          const hydratedMatches = data.matches.map((m: any) => ({
            ...m,
            demand: m.demand || demandMap.get(m.demand_id) || demands[0],
            score_label: m.score_label || `${m.score}% Fit`,
            data_status: m.data_status || demandMap.get(m.demand_id)?.data_status || 'synthetic_demo',
          }));
          setMatches(hydratedMatches);
          if (data?.meta?.source === 'gemma' || data?.meta?.ai_source === 'gemma_live') {
            setAiSource('gemma_live');
          } else if (data?.meta?.ai_source) {
            setAiSource(data.meta.ai_source);
          }
          if (data?.meta?.model) {
            setAiModel(data.meta.model);
          }
        }
      }
    } catch {
      // Keep deterministic local matches if API route is offline
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleConfirmPassport = (
    confirmedProfile: StartupProfile,
    source?: 'gemma_live' | 'demo_fixture',
    model?: string
  ) => {
    setProfile(confirmedProfile);
    setIsPassportConfirmed(true);
    if (source) setAiSource(source);
    if (model) setAiModel(model);
    refreshDemandMatches(confirmedProfile);
    setActiveTab('discover');
    setChallengeSubView('list');
    showToast(
      `Profile confirmed. Challenges are now ranked for ${
        confirmedProfile.startup_name || 'your startup'
      }.`
    );
  };

  const handleSelectMatchFromHomeOrBoard = (match: ReverseMatch) => {
    setSelectedMatchId(match.demand_id);
    setActiveTab('discover');
    setChallengeSubView('detail');
  };

  const handleOpenPocBuilder = (match: ReverseMatch) => {
    setSelectedMatchId(match.demand_id);
    setActiveTab('discover');
    setChallengeSubView('poc');
  };

  const handleSaveQualifiedDeal = (match: ReverseMatch) => {
    const created = createQualifiedDealFromMatch({
      startupName: profile.startup_name || 'AgriSmart',
      demand: match.demand,
    });
    setLocalDeals(getLocalDeals());
    showToast(`Saved "${created.title}" to your deals.`);
  };

  const handleSaveDealWithPoc = (
    match: ReverseMatch,
    plan: POCPlan,
    nextActionTitle: string,
    cadenceDays: 30 | 90 | 180
  ) => {
    const deal = createQualifiedDealFromMatch({
      startupName: profile.startup_name || 'AgriSmart',
      demand: match.demand,
      pocPlan: plan,
      note: `Saved qualified match with 75-day proposed POC draft (${plan.title}).`,
    });

    if (nextActionTitle) {
      addDealTask({
        dealId: deal.id,
        title: nextActionTitle,
        cadenceDays,
      });
    }

    setLocalDeals(getLocalDeals());
    setActiveTab('deals');
    setDealsView('pipeline');
    showToast(`Pilot plan saved. ${match.demand.buyer_name} is now in your deals.`);
  };

  const ensureDealInLocalStorage = (dealId: string): string => {
    const existingLocal = getLocalDeals().find((d) => d.id === dealId);
    if (existingLocal) return existingLocal.id;

    const demoTarget = demoDeals.find((d) => d.id === dealId);
    if (demoTarget) {
      saveLocalDeal({
        ...demoTarget,
        data_status: 'self_reported',
      });
      return demoTarget.id;
    }
    return dealId;
  };

  const handleTransitionDeal = (
    dealId: string,
    toState: DealState,
    note: string
  ) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = appendDealEvent({
        dealId: targetId,
        toState,
        note,
      });
      setLocalDeals(deals);
      showToast(`Stage updated to "${getDealStateLabel(toState)}".`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not transition deal state.'
      );
    }
  };

  const handleAddTask = (
    dealId: string,
    title: string,
    cadenceDays: 30 | 90 | 180
  ) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = addDealTask({
        dealId: targetId,
        title,
        cadenceDays,
      });
      setLocalDeals(deals);
      showToast(`Follow-up scheduled in ${cadenceDays} days.`);
    } catch {
      // Ignore if deal not found
    }
  };

  const handleToggleTask = (dealId: string, taskId: string) => {
    try {
      const targetId = ensureDealInLocalStorage(dealId);
      const { deals } = toggleDealTask(targetId, taskId);
      setLocalDeals(deals);
    } catch {
      // Ignore if deal not found
    }
  };

  // 1-Click AgriSmart Golden Path Demo Runner
  const handleRunGoldenPath = () => {
    const goldenProfile: StartupProfile = {
      ...AGRISMART_PRESET,
      needs: [
        'crop disease detection',
        'mobile workflow',
        'offline-first',
        'Field pilot',
      ],
      missing_fields: [],
      confidence_notes: [
        ...AGRISMART_PRESET.confidence_notes,
        'Founder confirmed: Offline field capability confirmation',
      ],
    };

    setProfile(goldenProfile);
    setIsPassportConfirmed(true);

    const ranked = rankDemandMatches(goldenProfile, demands);
    setMatches(ranked);
    const topNusantara =
      ranked.find((m) => m.demand_id === 'DEMO-CH-001') || ranked[0];

    if (topNusantara) {
      setSelectedMatchId(topNusantara.demand_id);
      const pocPlan = buildDefaultPocPlan(goldenProfile, topNusantara);
      createQualifiedDealFromMatch({
        startupName: goldenProfile.startup_name || 'AgriSmart',
        demand: topNusantara.demand,
        pocPlan,
        note: 'Golden Path Demo: Qualified AgriSmart × Nusantara Food & Farms Innovation Lab (85/100 compatibility) with 75-day proposed POC plan.',
      });
      setLocalDeals(getLocalDeals());
    }

    setActiveTab('discover');
    setChallengeSubView('detail');
    showToast(
      'Guided demo ready: sample profile confirmed, best match opened and a pilot plan saved to your deals.'
    );
  };

  const isSelectedDealSaved = useMemo(() => {
    if (!selectedMatch) return false;
    return localDeals.some(
      (d) =>
        d.demand_id === selectedMatch.demand_id &&
        d.startup_name.toLowerCase() ===
          (profile.startup_name || 'AgriSmart').toLowerCase()
    );
  }, [localDeals, selectedMatch, profile.startup_name]);

  const discoverTitle =
    challengeSubView === 'detail'
      ? 'Challenge details'
      : challengeSubView === 'poc'
      ? 'Pilot plan'
      : undefined;
  const stepIndex = DISCOVER_STEPS.findIndex((s) => s.id === challengeSubView);

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={handleNavigate}
      title={activeTab === 'discover' ? discoverTitle : undefined}
      activeDealsCount={localDeals.length}
      aiSource={aiSource}
      aiModel={aiModel}
      profile={profile}
      onRunGoldenPath={handleRunGoldenPath}
    >
      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="global-toast-banner"
          className="animate-toast-in fixed inset-x-4 bottom-[84px] z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-float md:bottom-6"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jade-bright" aria-hidden="true" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss"
            className="-m-1 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {activeTab === 'discover' && challengeSubView !== 'list' ? (
        <nav aria-label="Progress" className="mb-5">
          <ol className="flex items-center gap-2 text-xs font-semibold">
            {DISCOVER_STEPS.map((step, i) => {
              const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo';
              return (
                <li key={step.id} className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span
                    className={`h-1 rounded-full ${
                      state === 'todo' ? 'bg-ink/10' : 'bg-jade-bright'
                    }`}
                  />
                  {state === 'done' ? (
                    <button
                      type="button"
                      onClick={() => setChallengeSubView(step.id)}
                      className="truncate text-left text-muted hover:text-ink cursor-pointer"
                    >
                      {step.label}
                    </button>
                  ) : (
                    <span
                      aria-current={state === 'current' ? 'step' : undefined}
                      className={`truncate ${state === 'current' ? 'text-ink' : 'text-muted/70'}`}
                    >
                      {step.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {activeTab === 'home' && (
        <HomeGateway
          profile={profile}
          isPassportConfirmed={isPassportConfirmed}
          demands={demands}
          matches={matches}
          localDeals={localDeals}
          demoDeals={demoDeals}
          onNavigate={handleNavigate}
          onRunGoldenPath={handleRunGoldenPath}
          onSelectMatch={handleSelectMatchFromHomeOrBoard}
        />
      )}

      {activeTab === 'discover' && challengeSubView === 'list' && (
        <DemandBoard
          profile={profile}
          matches={matches}
          onSelectMatch={handleSelectMatchFromHomeOrBoard}
          onOpenPocBuilder={handleOpenPocBuilder}
          onRefreshMatches={() => refreshDemandMatches(profile)}
          isLoading={isLoadingMatches}
          onAddCustomDemand={(newBrief, scoredMatch) => {
            setDemands((prev) => [newBrief, ...prev]);
            setMatches((prev) => [scoredMatch, ...prev]);
            showToast(`Posted "${newBrief.title}". Fit score ${scoredMatch.score}/100.`);
          }}
        />
      )}

      {activeTab === 'discover' && challengeSubView === 'detail' && selectedMatch && (
        <ReverseMatchDetail
          profile={profile}
          match={selectedMatch}
          onBack={() => setChallengeSubView('list')}
          onOpenPocBuilder={handleOpenPocBuilder}
          onSaveQualifiedDeal={handleSaveQualifiedDeal}
          isDealSaved={isSelectedDealSaved}
        />
      )}

      {activeTab === 'discover' && challengeSubView === 'poc' && selectedMatch && (
        <PilotPlanEditor
          profile={profile}
          match={selectedMatch}
          onBack={() => setChallengeSubView('detail')}
          onSaveDealWithPoc={handleSaveDealWithPoc}
        />
      )}

      {activeTab === 'deals' && (
        <div className="space-y-5">
          <Segmented
            label="Deals view"
            value={dealsView}
            onChange={setDealsView}
            options={[
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'outcomes', label: 'Outcomes' },
            ]}
          />
          {dealsView === 'pipeline' ? (
            <DealTrackerView
              localDeals={localDeals}
              demoDeals={demoDeals}
              onTransitionDeal={handleTransitionDeal}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onOpenChallenges={() => {
                setActiveTab('discover');
                setChallengeSubView('list');
              }}
            />
          ) : (
            <OutcomeAnalyticsView localDeals={localDeals} demoDeals={demoDeals} />
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-5">
          <Segmented
            label="Profile view"
            value={profileView}
            onChange={setProfileView}
            options={[
              { id: 'passport', label: 'Startup passport' },
              { id: 'readiness', label: 'Investor readiness' },
            ]}
          />
          {profileView === 'passport' ? (
            <StartupPassportFlow
              profile={profile}
              onProfileChange={setProfile}
              onConfirmPassport={handleConfirmPassport}
              aiSource={aiSource}
              aiModel={aiModel}
            />
          ) : (
            <InvestorReadinessView profile={profile} aiSource={aiSource} />
          )}
        </div>
      )}
    </AppShell>
  );
}
