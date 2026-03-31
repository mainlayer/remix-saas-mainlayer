/**
 * Basic Mainlayer integration example for Remix.
 *
 * This shows how to verify access and create checkout sessions
 * outside of the full SaaS boilerplate context.
 */
import { MainlayerClient } from '@mainlayer/sdk';

const mainlayer = new MainlayerClient({
  apiKey: process.env.MAINLAYER_API_KEY!,
});

async function main() {
  const userId = 'user_demo_123';
  const proResourceId = process.env.MAINLAYER_PRO_RESOURCE_ID ?? 'plan_pro';

  // 1. Check if user has Pro access
  console.log('Checking subscription status...');
  const access = await mainlayer.resources.verifyAccess(proResourceId, userId);
  console.log('Access result:', {
    authorized: access.authorized,
    plan: access.metadata?.plan ?? 'free',
  });

  if (!access.authorized) {
    // 2. Create a checkout session to upgrade
    console.log('\nCreating checkout session...');
    const session = await mainlayer.checkout.create({
      resourceId: proResourceId,
      userId,
      successUrl: 'https://yourapp.com/billing?success=true',
      cancelUrl: 'https://yourapp.com/billing?canceled=true',
    });
    console.log('Redirect user to:', session.url);
  } else {
    // 3. Create a billing portal session to manage subscription
    console.log('\nCreating billing portal session...');
    const portal = await mainlayer.billing.createPortalSession({
      userId,
      returnUrl: 'https://yourapp.com/billing',
    });
    console.log('Redirect user to portal:', portal.url);
  }
}

main().catch(console.error);
