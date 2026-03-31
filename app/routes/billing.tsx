import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import { requireUserId } from '~/lib/auth.server';
import {
  checkSubscription,
  getPlans,
  getPlanById,
  createSubscription,
  PLANS,
  type Plan,
} from '~/lib/mainlayer.server';

export const meta: MetaFunction = () => [{ title: 'Billing — Remix SaaS' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Check current subscription status for each plan
  const plans = getPlans();
  const statuses = await Promise.all(
    plans.map(plan => checkSubscription(userId, plan.id as Plan))
  );

  // Find highest tier subscription
  let currentPlan: Plan = 'free';
  if (statuses.some(s => s.plan === 'enterprise' && s.authorized)) {
    currentPlan = 'enterprise';
  } else if (statuses.some(s => s.plan === 'pro' && s.authorized)) {
    currentPlan = 'pro';
  }

  return json({
    currentPlan,
    plans,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const formData = await request.formData();
  const intent = formData.get('intent');
  const planId = formData.get('plan') as string;

  if (intent === 'subscribe') {
    const plan = getPlanById(planId);
    if (!plan) {
      return json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    try {
      const subscription = await createSubscription(userId, plan.id as Plan);
      return json({ success: true, subscription });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription failed';
      return json({ error: message }, { status: 500 });
    }
  }

  return json({ error: 'Unknown action.' }, { status: 400 });
}

export default function Billing() {
  const { currentPlan, plans } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
          ← Dashboard
        </a>
        <span className="font-bold text-lg">Billing</span>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Plans & Pricing</h1>
          <p className="text-gray-600 mt-2">
            Choose the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        {actionData && 'error' in actionData && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {actionData.error}
          </div>
        )}

        {actionData && 'success' in actionData && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
            Subscription updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const priceDisplay = plan.price_usd_cents === 0
              ? 'Free'
              : `$${(plan.price_usd_cents / 100).toFixed(2)}`;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 p-8 transition-all ${
                  isCurrent
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-6">
                  <h3 className="font-bold text-xl">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <p className="text-4xl font-bold">{priceDisplay}</p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm">
                      <span className="text-green-600 font-bold">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-8 border-t">
                  {isCurrent ? (
                    <div className="text-center py-3 px-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">
                        Current Plan
                      </p>
                    </div>
                  ) : plan.id === 'enterprise' ? (
                    <a
                      href="mailto:sales@mainlayer.fr?subject=Enterprise%20Plan%20Inquiry"
                      className="block text-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Contact Sales
                    </a>
                  ) : (
                    <Form method="post">
                      <input type="hidden" name="intent" value="subscribe" />
                      <input type="hidden" name="plan" value={plan.id} />
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      >
                        {currentPlan === 'free' ? 'Upgrade to ' : 'Switch to '}{plan.name}
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border p-8 mt-12">
          <h2 className="text-lg font-bold mb-4">Billing & Support</h2>
          <p className="text-gray-700 mb-4">
            Need help with your subscription or have billing questions?
          </p>
          <div className="flex gap-4">
            <a
              href="https://docs.mainlayer.fr"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Documentation
            </a>
            <a
              href="mailto:support@mainlayer.fr"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
