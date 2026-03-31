/**
 * Mainlayer service for subscription management.
 *
 * Provides server-side integration with Mainlayer payment infrastructure.
 * All methods handle errors gracefully with appropriate fallbacks.
 */

const MAINLAYER_API_URL =
  process.env.MAINLAYER_API_URL ?? 'https://api.mainlayer.fr';

function getApiKey(): string {
  const key = process.env.MAINLAYER_API_KEY;
  if (!key) {
    throw new Error(
      'MAINLAYER_API_KEY environment variable is required'
    );
  }
  return key;
}

function buildHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  if (!response.ok) {
    let message = `API error (${response.status})`;
    try {
      const json = JSON.parse(body);
      message = json.error?.message || json.message || message;
    } catch {
      message = body || message;
    }
    throw new Error(message);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('Invalid JSON response from Mainlayer API');
  }
}

export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanConfig {
  id: Plan;
  name: string;
  description: string;
  price_usd_cents: number;
  interval: 'month' | 'year';
  features: string[];
  resource_id: string;
}

export interface SubscriptionStatus {
  plan: Plan;
  authorized: boolean;
  subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
}

export interface Subscription {
  subscription_id: string;
  resource_id: string;
  status: 'active' | 'pending' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end?: string;
  canceled_at?: string;
}

/**
 * Available plans — update resource_id values from dashboard.mainlayer.fr
 */
export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price_usd_cents: 0,
    interval: 'month',
    features: [
      'Up to 100 API calls per month',
      'Basic analytics',
      'Email support',
    ],
    resource_id: process.env.MAINLAYER_RESOURCE_FREE ?? 'res_free',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing applications',
    price_usd_cents: 2900,
    interval: 'month',
    features: [
      'Up to 50,000 API calls per month',
      'Advanced analytics',
      'Priority support',
      'Custom webhooks',
    ],
    resource_id: process.env.MAINLAYER_RESOURCE_PRO ?? 'res_pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited scale with dedicated support',
    price_usd_cents: 9900,
    interval: 'month',
    features: [
      'Unlimited API calls',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    resource_id: process.env.MAINLAYER_RESOURCE_ENTERPRISE ?? 'res_enterprise',
  },
];

export const PLAN_RESOURCE_IDS: Record<Plan, string> = {
  free: process.env.MAINLAYER_RESOURCE_FREE ?? 'res_free',
  pro: process.env.MAINLAYER_RESOURCE_PRO ?? 'res_pro',
  enterprise: process.env.MAINLAYER_RESOURCE_ENTERPRISE ?? 'res_enterprise',
};

/**
 * Get list of available plans.
 */
export function getPlans(): PlanConfig[] {
  return PLANS;
}

/**
 * Get a plan by ID.
 */
export function getPlanById(planId: string): PlanConfig | undefined {
  return PLANS.find(p => p.id === planId);
}

/**
 * Create a subscription for a user.
 */
export async function createSubscription(
  userId: string,
  planId: Plan
): Promise<Subscription> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const response = await fetch(
    `${MAINLAYER_API_URL}/subscriptions/approve`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        resource_id: plan.resource_id,
        user_id: userId,
      }),
    }
  );

  return handleResponse<Subscription>(response);
}

/**
 * Get subscription status for a user and resource.
 */
export async function getSubscriptionStatus(
  userId: string,
  resourceId: string
): Promise<Subscription | null> {
  try {
    const params = new URLSearchParams({
      resource_id: resourceId,
      user_id: userId,
    });

    const response = await fetch(
      `${MAINLAYER_API_URL}/subscriptions/status?${params.toString()}`,
      {
        method: 'GET',
        headers: buildHeaders(),
      }
    );

    if (response.status === 404) {
      return null;
    }

    return handleResponse<Subscription>(response);
  } catch (error) {
    console.error('[Mainlayer] getSubscriptionStatus error:', error);
    return null;
  }
}

/**
 * Check if a user has an active subscription for a plan.
 */
export async function checkSubscription(
  userId: string,
  planId: Plan
): Promise<SubscriptionStatus> {
  try {
    const plan = getPlanById(planId);
    if (!plan) {
      return { plan: 'free', authorized: false };
    }

    const subscription = await getSubscriptionStatus(userId, plan.resource_id);

    return {
      plan: planId,
      authorized: subscription?.status === 'active',
      subscription_id: subscription?.subscription_id,
      current_period_start: subscription?.current_period_start,
      current_period_end: subscription?.current_period_end,
      canceled_at: subscription?.canceled_at,
    };
  } catch (error) {
    console.error('[Mainlayer] checkSubscription error:', error);
    return { plan: planId, authorized: false };
  }
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const response = await fetch(
    `${MAINLAYER_API_URL}/subscriptions/cancel`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        subscription_id: subscriptionId,
      }),
    }
  );

  return handleResponse<Subscription>(response);
}
