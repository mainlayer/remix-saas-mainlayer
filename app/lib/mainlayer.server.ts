import { MainlayerClient } from '@mainlayer/sdk';

if (!process.env.MAINLAYER_API_KEY) {
  throw new Error('MAINLAYER_API_KEY environment variable is required');
}

export const mainlayer = new MainlayerClient({
  apiKey: process.env.MAINLAYER_API_KEY,
});

export type Plan = 'free' | 'pro' | 'enterprise';

export interface SubscriptionStatus {
  plan: Plan;
  authorized: boolean;
  expiresAt?: string;
}

/**
 * Verify a user has access to a given resource/plan.
 */
export async function checkSubscription(
  userId: string,
  resourceId: string,
): Promise<SubscriptionStatus> {
  try {
    const access = await mainlayer.resources.verifyAccess(resourceId, userId);
    return {
      plan: (access.metadata?.plan as Plan) ?? 'free',
      authorized: access.authorized,
      expiresAt: access.metadata?.expiresAt as string | undefined,
    };
  } catch (error) {
    console.error('[Mainlayer] checkSubscription error:', error);
    return { plan: 'free', authorized: false };
  }
}

/**
 * Create a checkout session for upgrading to a plan.
 */
export async function createCheckoutSession(
  userId: string,
  planResourceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const session = await mainlayer.checkout.create({
    resourceId: planResourceId,
    userId,
    successUrl,
    cancelUrl,
  });
  return session.url;
}

/**
 * Open a billing portal session for managing subscriptions.
 */
export async function createBillingPortalSession(
  userId: string,
  returnUrl: string,
): Promise<string> {
  const portal = await mainlayer.billing.createPortalSession({
    userId,
    returnUrl,
  });
  return portal.url;
}

/**
 * Resource IDs for each plan — set these in your Mainlayer dashboard.
 */
export const PLAN_RESOURCE_IDS: Record<Plan, string> = {
  free: process.env.MAINLAYER_FREE_RESOURCE_ID ?? 'plan_free',
  pro: process.env.MAINLAYER_PRO_RESOURCE_ID ?? 'plan_pro',
  enterprise: process.env.MAINLAYER_ENTERPRISE_RESOURCE_ID ?? 'plan_enterprise',
};
