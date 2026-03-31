import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { getUser } from '~/lib/auth.server';

export const meta: MetaFunction = () => [
  { title: 'Remix SaaS — Powered by Mainlayer' },
  { name: 'description', content: 'SaaS starter with Mainlayer billing' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to Remix SaaS</h1>
        <p className="text-lg text-gray-600">
          A production-ready SaaS boilerplate with Mainlayer subscription billing.
        </p>

        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Dashboard
              </Link>
              <Link
                to="/billing"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Billing
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Get started free
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-left">
          {[
            { title: 'Free', price: '$0/mo', features: ['5 projects', '1 GB storage', 'Community support'] },
            { title: 'Pro', price: '$29/mo', features: ['Unlimited projects', '50 GB storage', 'Priority support'] },
            { title: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'SSO', 'SLA guarantee'] },
          ].map((plan) => (
            <div key={plan.title} className="border rounded-lg p-6 bg-white shadow-sm">
              <h3 className="font-semibold text-lg">{plan.title}</h3>
              <p className="text-2xl font-bold mt-1">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
