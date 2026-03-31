import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import { requireUserId } from '~/lib/auth.server';
import {
  checkSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  PLAN_RESOURCE_IDS,
  type Plan,
} from '~/lib/mainlayer.server';

export const meta: MetaFunction = () => [{ title: 'Billing — Remix SaaS' }];

const PLANS: Array<{
  id: Plan;
  name: string;
  price: string;
  description: string;
  features: string[];
}> = [
  {
    id: 'free',
    name: 'Free',
    price: '$0/month',
    description: 'Get started for free.',
    features: ['5 projects', '1 GB storage', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/month',
    description: 'Everything you need to scale.',
    features: ['Unlimited projects', '50 GB storage', 'Priority support', 'Analytics'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams with advanced needs.',
    features: ['Everything in Pro', 'SSO', 'Audit logs', 'SLA', 'Dedicated support'],
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const [proAccess, enterpriseAccess] = await Promise.all([
    checkSubscription(userId, PLAN_RESOURCE_IDS.pro),
    checkSubscription(userId, PLAN_RESOURCE_IDS.enterprise),
  ]);
  const currentPlan: Plan = enterpriseAccess.authorized
    ? 'enterprise'
    : proAccess.authorized
    ? 'pro'
    : 'free';
  return json({ currentPlan });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  const origin = new URL(request.url).origin;

  if (intent === 'portal') {
    const url = await createBillingPortalSession(userId, `${origin}/billing`);
    return redirect(url);
  }

  if (intent === 'subscribe') {
    const plan = formData.get('plan') as Plan;
    if (!plan || !PLAN_RESOURCE_IDS[plan]) {
      return json({ error: 'Invalid plan selected.' }, { status: 400 });
    }
    const url = await createCheckoutSession(
      userId,
      PLAN_RESOURCE_IDS[plan],
      `${origin}/billing?success=true`,
      `${origin}/billing?canceled=true`,
    );
    return redirect(url);
  }

  return json({ error: 'Unknown action.' }, { status: 400 });
}

export default function Billing() {
  const { currentPlan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
          ← Dashboard
        </a>
        <span className="font-bold text-lg">Billing</span>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Plans & Billing</h1>
          <Form method="post">
            <input type="hidden" name="intent" value="portal" />
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Manage Billing Portal
            </button>
          </Form>
        </div>

        {actionData && 'error' in actionData && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {actionData.error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg border p-6 ${
                  isCurrent ? 'border-blue-500 ring-2 ring-blue-200' : ''
                }`}
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1">{plan.price}</p>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <span className="block text-center text-sm font-medium text-blue-600">
                      Current Plan
                    </span>
                  ) : plan.id === 'enterprise' ? (
                    <a
                      href="mailto:sales@mainlayer.fr"
                      className="block text-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Contact Sales
                    </a>
                  ) : (
                    <Form method="post">
                      <input type="hidden" name="intent" value="subscribe" />
                      <input type="hidden" name="plan" value={plan.id} />
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Upgrade to {plan.name}
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
