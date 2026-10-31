import { z } from 'zod';
import type { PrimaryGoal, StartupProfile, StartupStage } from '@/types';

export const DEFAULT_OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it';
export const OPENROUTER_ENDPOINT =
  'https://openrouter.ai/api/v1/chat/completions';

export const StartupStageSchema = z.enum([
  'Idea',
  'Pre-seed',
  'Seed',
  'Series A',
  'Growth',
]);

export const PrimaryGoalSchema = z.enum([
  'Investment',
  'Pilot Partnership',
  'Market Expansion',
  'Accelerator',
]);

export const StartupProfileSchema = z.object({
  startup_name: z.string().nullable(),
  description: z.string(),
  industry: z.string().nullable(),
  home_country: z.string().nullable(),
  target_country: z.string().nullable(),
  stage: StartupStageSchema.nullable(),
  product: z.string().nullable(),
  primary_goal: PrimaryGoalSchema.nullable(),
  needs: z.array(z.string()),
  missing_fields: z.array(z.string()),
  confidence_notes: z.array(z.string()),
});

export const ReverseMatchExplanationSchema = z.object({
  why_match: z.string().min(1),
  potential_collaboration: z.string().min(1),
  fit_gaps: z.array(z.string()),
  next_action: z.string().min(1),
});

export const POCPlanSchema = z.object({
  deal_id: z.string(),
  demand_id: z.string(),
  title: z.string(),
  partner_name: z.string(),
  startup_name: z.string(),
  country: z.string(),
  sector: z.string(),
  status: z.enum([
    'proposed',
    'under_review',
    'agreed',
    'running',
    'completed',
  ]),
  proposed_duration_days: z.number(),
  objective: z.string(),
  proposed_scope: z.string(),
  target_users_label: z.string(),
  estimated_budget_note: z.string(),
  milestones: z.array(
    z.object({
      phase: z.string(),
      window_label: z.string(),
      day: z.number(),
      action: z.string(),
      owner: z.enum(['startup', 'partner', 'joint']),
      deliverables: z.array(z.string()),
    })
  ),
  success_criteria: z.array(
    z.object({
      metric: z.string(),
      target: z.string(),
      validation_method: z.string(),
    })
  ),
  preconditions: z.array(z.string()),
  ip_questions: z.array(z.string()),
  data_sharing_questions: z.array(z.string()),
  liability_questions: z.array(z.string()),
  possible_conversion_to_paid: z.string(),
  outreach_email: z.object({
    language: z.enum(['English', 'Bahasa Melayu', 'Bahasa Indonesia']),
    subject: z.string(),
    body: z.string(),
  }),
  ai_source: z.enum(['gemma_live', 'demo_fixture']),
});

export function isLiveOpenRouterKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('replace_me') ||
    lower === 'none' ||
    lower === 'demo'
  ) {
    return false;
  }
  return trimmed.length >= 12;
}

export function getOpenRouterConfig(): {
  apiKey: string | null;
  model: string;
  hasLiveKey: boolean;
} {
  const rawKey = process.env.OPENROUTER_API_KEY || null;
  const model = (
    process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
  ).trim();
  const hasLiveKey = isLiveOpenRouterKey(rawKey);
  return {
    apiKey: hasLiveKey && rawKey ? rawKey.trim() : null,
    model,
    hasLiveKey,
  };
}

function stripJsonCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

export async function callGemmaJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  fallback: T;
  timeoutMs?: number;
}): Promise<{
  data: T;
  ai_source: 'gemma_live' | 'demo_fixture';
  model: string;
}> {
  const { apiKey, model, hasLiveKey } = getOpenRouterConfig();

  if (!hasLiveKey || !apiKey) {
    return {
      data: params.fallback,
      ai_source: 'demo_fixture',
      model,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    params.timeoutMs ?? 8000
  );

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bridgeai-asean.vercel.app',
        'X-Title': 'ASEAN BridgeAI V2',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        data: params.fallback,
        ai_source: 'demo_fixture',
        model,
      };
    }

    const payload = await response.json();
    const rawContent: string | undefined =
      payload?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return {
        data: params.fallback,
        ai_source: 'demo_fixture',
        model,
      };
    }

    const cleaned = stripJsonCodeFences(rawContent);
    const parsedJson = JSON.parse(cleaned);
    const validated = params.schema.safeParse(parsedJson);

    if (!validated.success) {
      return {
        data: params.fallback,
        ai_source: 'demo_fixture',
        model,
      };
    }

    return {
      data: validated.data,
      ai_source: 'gemma_live',
      model,
    };
  } catch {
    return {
      data: params.fallback,
      ai_source: 'demo_fixture',
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractStartupPassportDeterministic(
  descriptionText: string
): StartupProfile {
  const text = descriptionText.trim();
  const lower = text.toLowerCase();

  let startup_name: string | null = null;
  if (lower.includes('agrismart')) {
    startup_name = 'AgriSmart';
  } else if (lower.includes('greentech')) {
    startup_name = 'GreenTech Solutions';
  } else if (lower.includes('finbridge')) {
    startup_name = 'FinBridge Rural KYC';
  } else {
    const weAreMatch = text.match(/we are\s+([A-Z][A-Za-z0-9_-]{1,28})/i);
    if (weAreMatch && weAreMatch[1]) {
      startup_name = weAreMatch[1];
    }
  }

  let industry: string | null = null;
  if (
    lower.includes('leaf-disease') ||
    lower.includes('crop') ||
    lower.includes('agritech') ||
    lower.includes('farm') ||
    lower.includes('aquaculture')
  ) {
    industry = 'AgriTech';
  } else if (
    lower.includes('credit') ||
    lower.includes('fintech') ||
    lower.includes('kyc') ||
    lower.includes('micro-finance')
  ) {
    industry = 'Fintech';
  } else if (
    lower.includes('clean energy') ||
    lower.includes('scope 2') ||
    lower.includes('carbon') ||
    lower.includes('energy')
  ) {
    industry = 'Clean Energy';
  } else if (
    lower.includes('fleet') ||
    lower.includes('smart city') ||
    lower.includes('mobility')
  ) {
    industry = 'Smart City';
  } else if (lower.includes('cold-chain') || lower.includes('spoilage')) {
    industry = 'Sustainability';
  } else if (lower.includes('ai') || lower.includes('machine learning')) {
    industry = 'AI';
  }

  let stage: StartupStage | null = null;
  if (lower.includes('pre-seed') || lower.includes('pre seed')) {
    stage = 'Pre-seed';
  } else if (lower.includes('series a')) {
    stage = 'Series A';
  } else if (
    lower.includes('seed-stage') ||
    lower.includes('seed stage') ||
    lower.includes('seed')
  ) {
    stage = 'Seed';
  } else if (lower.includes('growth')) {
    stage = 'Growth';
  } else if (lower.includes('idea')) {
    stage = 'Idea';
  }

  let home_country: string | null = null;
  if (lower.includes('malaysian') || lower.includes('from malaysia')) {
    home_country = 'Malaysia';
  } else if (
    lower.includes('singaporean') ||
    lower.includes('singapore seed') ||
    lower.includes('from singapore')
  ) {
    home_country = 'Singapore';
  } else if (lower.includes('from indonesia')) {
    home_country = 'Indonesia';
  } else if (lower.includes('from thailand')) {
    home_country = 'Thailand';
  } else if (lower.includes('from vietnam')) {
    home_country = 'Vietnam';
  }

  let target_country: string | null = null;
  if (lower.includes('indonesian') || lower.includes('indonesia')) {
    target_country = 'Indonesia';
  } else if (lower.includes('malaysia') && home_country !== 'Malaysia') {
    target_country = 'Malaysia';
  } else if (lower.includes('singapore') && home_country !== 'Singapore') {
    target_country = 'Singapore';
  } else if (lower.includes('thailand')) {
    target_country = 'Thailand';
  } else if (lower.includes('vietnam')) {
    target_country = 'Vietnam';
  } else if (lower.includes('philippines')) {
    target_country = 'Philippines';
  }

  let primary_goal: PrimaryGoal | null = null;
  if (
    lower.includes('pilot') ||
    lower.includes('field-pilot') ||
    lower.includes('problem to solve')
  ) {
    primary_goal = 'Pilot Partnership';
  } else if (lower.includes('invest') || lower.includes('funding')) {
    primary_goal = 'Investment';
  } else if (lower.includes('expand') || lower.includes('expansion')) {
    primary_goal = 'Market Expansion';
  } else if (lower.includes('accelerator')) {
    primary_goal = 'Accelerator';
  }

  let product: string | null = null;
  if (lower.includes('leaf-disease')) {
    product = 'Phone-based AI leaf-disease screening app';
  } else if (lower.includes('scope 2')) {
    product =
      'Low-carbon IoT energy load monitoring & automated Scope 2 ESG reporting platform';
  } else if (lower.includes('credit scoring')) {
    product =
      'Explainable alternative credit scoring & rural cooperative onboarding engine';
  } else if (text.length > 0) {
    product = text.slice(0, 100);
  }

  const needs: string[] = [];
  if (lower.includes('leaf-disease') || lower.includes('crop')) {
    needs.push('crop disease detection');
  }
  if (lower.includes('phone-based') || lower.includes('mobile')) {
    needs.push('mobile workflow');
  }
  if (lower.includes('pilot') || lower.includes('field-pilot')) {
    needs.push('Field pilot');
  }
  if (lower.includes('offline')) {
    needs.push('offline-first');
  }
  if (lower.includes('energy')) {
    needs.push('energy load monitoring');
  }
  if (lower.includes('scope 2')) {
    needs.push('Scope 2 carbon reporting');
  }
  if (lower.includes('credit')) {
    needs.push('alternative credit scoring', 'explainable risk model');
  }
  if (needs.length === 0) {
    needs.push('ASEAN cross-border pilot partner');
  }

  const missing_fields: string[] = [];
  if (!startup_name) missing_fields.push('Startup name not explicitly stated');
  if (!industry) missing_fields.push('Primary industry vertical not stated');
  if (!stage) missing_fields.push('Current funding stage not stated');
  if (!home_country) missing_fields.push('Home ASEAN country not stated');
  if (!target_country)
    missing_fields.push('Target ASEAN expansion country not stated');
  if (!primary_goal)
    missing_fields.push('Primary partnership goal not stated');
  if (industry === 'AgriTech' && !lower.includes('offline')) {
    missing_fields.push('Offline field capability confirmation');
  }

  const confidence_notes: string[] = [
    'Extracted strictly from founder narrative without inventing unsupported claims.',
    missing_fields.length > 0
      ? `Identified ${missing_fields.length} unconfirmed item(s) to verify before reverse-matching.`
      : 'All core matching fields present in description.',
  ];

  return {
    startup_name,
    description: text,
    industry,
    home_country,
    target_country,
    stage,
    product,
    primary_goal,
    needs,
    missing_fields,
    confidence_notes,
  };
}
