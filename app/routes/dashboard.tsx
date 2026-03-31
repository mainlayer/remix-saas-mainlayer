import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { requireUserId, getUser } from '~/lib/auth.server';
import { checkSubscription, PLAN_RESOURCE_IDS } from '~/lib/mainlayer.server';

export const meta: MetaFunction = () => [{ title: 'Dashboard' }];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  // Check which plan the user has access to
  const [proAccess, enterpriseAccess] = await Promise.all([
    checkSubscription(userId, PLAN_RESOURCE_IDS.pro),
    checkSubscription(userId, PLAN_RESOURCE_IDS.enterprise),
  ]);

  const plan = enterpriseAccess.authorized
    ? 'enterprise'
    : proAccess.authorized
    ? 'pro'
    : 'free';

  return json({ user, plan, subscription: proAccess.authorized ? proAccess : { plan: 'free', authorized: true } });
}

export default function Dashboard() {
  const { user, plan, subscription } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">Remix SaaS</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Form action="/logout" method="post">
            <button className="text-sm text-gray-500 hover:text-gray-800">Sign out</button>
          </Form>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-xl font-semibold capitalize mt-1">{plan}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan === 'enterprise'
                  ? 'bg-purple-100 text-purple-700'
                  : plan === 'pro'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {plan.toUpperCase()}
            </span>
          </div>
          {subscription.expiresAt && (
            <p className="text-sm text-gray-400 mt-2">
              Renews: {new Date(subscription.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FeatureCard
            title="Pro Features"
            locked={plan === 'free'}
            description="Access advanced analytics and priority support."
          />
          <FeatureCard
            title="Enterprise Features"
            locked={plan !== 'enterprise'}
            description="SSO, audit logs, and dedicated infrastructure."
          />
        </div>

        {plan === 'free' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold">Upgrade to Pro</p>
              <p className="text-sm text-gray-600">Unlock unlimited projects and priority support.</p>
            </div>
            <a
              href="/billing"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              View Plans
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  locked,
  description,
}: {
  title: string;
  locked: boolean;
  description: string;
}) {
  return (
    <div className={`bg-white rounded-lg border p-6 ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
        {locked && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Locked
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
}
