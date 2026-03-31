import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @mainlayer/sdk before importing the module under test
vi.mock('@mainlayer/sdk', () => {
  return {
    MainlayerClient: vi.fn().mockImplementation(() => ({
      resources: {
        verifyAccess: vi.fn(),
      },
      checkout: {
        create: vi.fn(),
      },
      billing: {
        createPortalSession: vi.fn(),
      },
    })),
  };
});

// Set required env var before module import
process.env.MAINLAYER_API_KEY = 'test_api_key';
process.env.MAINLAYER_PRO_RESOURCE_ID = 'plan_pro';
process.env.MAINLAYER_ENTERPRISE_RESOURCE_ID = 'plan_enterprise';

const { MainlayerClient } = await import('@mainlayer/sdk');

describe('Mainlayer billing helpers', () => {
  let mockClient: ReturnType<typeof MainlayerClient.prototype.constructor>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mocked instance
    mockClient = (MainlayerClient as ReturnType<typeof vi.fn>).mock.results[0]?.value;
  });

  describe('checkSubscription', () => {
    it('returns authorized=true when user has pro access', async () => {
      const { checkSubscription } = await import('../app/lib/mainlayer.server');

      if (mockClient) {
        mockClient.resources.verifyAccess.mockResolvedValue({
          authorized: true,
          metadata: { plan: 'pro', expiresAt: '2025-12-31T00:00:00Z' },
        });
      }

      const result = await checkSubscription('user_123', 'plan_pro');
      expect(result.authorized).toBe(true);
      expect(result.plan).toBe('pro');
    });

    it('returns authorized=false when user has no subscription', async () => {
      const { checkSubscription } = await import('../app/lib/mainlayer.server');

      if (mockClient) {
        mockClient.resources.verifyAccess.mockResolvedValue({
          authorized: false,
          metadata: {},
        });
      }

      const result = await checkSubscription('user_456', 'plan_pro');
      expect(result.authorized).toBe(false);
      expect(result.plan).toBe('free');
    });

    it('returns free plan on SDK error (graceful fallback)', async () => {
      const { checkSubscription } = await import('../app/lib/mainlayer.server');

      if (mockClient) {
        mockClient.resources.verifyAccess.mockRejectedValue(new Error('Network error'));
      }

      const result = await checkSubscription('user_789', 'plan_pro');
      expect(result.authorized).toBe(false);
      expect(result.plan).toBe('free');
    });
  });

  describe('createCheckoutSession', () => {
    it('returns a checkout URL', async () => {
      const { createCheckoutSession } = await import('../app/lib/mainlayer.server');

      if (mockClient) {
        mockClient.checkout.create.mockResolvedValue({
          url: 'https://checkout.mainlayer.fr/session_abc123',
        });
      }

      const url = await createCheckoutSession(
        'user_123',
        'plan_pro',
        'https://app.example.com/billing?success=true',
        'https://app.example.com/billing?canceled=true',
      );
      expect(url).toMatch(/^https:\/\//);
    });
  });

  describe('createBillingPortalSession', () => {
    it('returns a portal URL', async () => {
      const { createBillingPortalSession } = await import('../app/lib/mainlayer.server');

      if (mockClient) {
        mockClient.billing.createPortalSession.mockResolvedValue({
          url: 'https://portal.mainlayer.fr/portal_xyz',
        });
      }

      const url = await createBillingPortalSession(
        'user_123',
        'https://app.example.com/billing',
      );
      expect(url).toMatch(/^https:\/\//);
    });
  });

  describe('PLAN_RESOURCE_IDS', () => {
    it('has entries for all plans', async () => {
      const { PLAN_RESOURCE_IDS } = await import('../app/lib/mainlayer.server');
      expect(PLAN_RESOURCE_IDS).toHaveProperty('free');
      expect(PLAN_RESOURCE_IDS).toHaveProperty('pro');
      expect(PLAN_RESOURCE_IDS).toHaveProperty('enterprise');
    });
  });
});
