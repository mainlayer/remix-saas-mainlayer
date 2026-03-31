![License](https://img.shields.io/badge/license-MIT-blue.svg)

# Remix + Mainlayer SaaS Starter

A modern SaaS boilerplate built with Remix v2 and integrated with Mainlayer payment infrastructure for subscription management.

## Features

- **Remix v2** with Vite for fast development
- **Type-safe** with TypeScript throughout
- **Authentication** with session-based auth
- **Billing Integration** with Mainlayer for subscription management
- **Three-tier Plans** (Free, Pro, Enterprise)
- **Protected Routes** with middleware
- **Testing** with Vitest and Vitest UI
- **Styling** with Tailwind CSS

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url> my-saas
cd my-saas
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Configure these environment variables:

```env
# Mainlayer API
MAINLAYER_API_KEY="your-api-key-from-dashboard.mainlayer.fr"
MAINLAYER_API_URL="https://api.mainlayer.fr"

# Resource IDs (from https://dashboard.mainlayer.fr/resources)
MAINLAYER_RESOURCE_FREE="res_free_xxx"
MAINLAYER_RESOURCE_PRO="res_pro_xxx"
MAINLAYER_RESOURCE_ENTERPRISE="res_enterprise_xxx"

# Session
SESSION_SECRET="generate-with: openssl rand -base64 32"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
app/
  ├── lib/
  │   ├── auth.server.ts          # Authentication utilities
  │   └── mainlayer.server.ts     # Mainlayer API client
  ├── routes/
  │   ├── _index.tsx              # Landing page
  │   ├── dashboard.tsx           # Protected dashboard
  │   └── billing.tsx             # Billing page
  └── components/                 # Reusable React components
```

## Key Files

### Mainlayer Service (`app/lib/mainlayer.server.ts`)

Type-safe API client for managing subscriptions:

```typescript
// Get available plans
const plans = getPlans();

// Check if user has active subscription
const status = await checkSubscription(userId, 'pro');

// Create subscription
const subscription = await createSubscription(userId, 'pro');

// Cancel subscription
await cancelSubscription(subscriptionId);
```

### Billing Route (`app/routes/billing.tsx`)

Handles subscription management:

- **Loader**: Fetches user's current plan and available plans
- **Action**: Processes subscription upgrades
- **UI**: Displays plan cards with pricing and features

## Usage Examples

### Check User's Subscription Status

```typescript
import { checkSubscription } from '~/lib/mainlayer.server';

const status = await checkSubscription(userId, 'pro');
if (status.authorized) {
  console.log('User has Pro subscription');
}
```

### Protect Routes Based on Plan

```typescript
// In a route loader
export async function loader({ request }) {
  const userId = await requireUserId(request);
  const status = await checkSubscription(userId, 'pro');

  if (!status.authorized) {
    return redirect('/billing');
  }

  return json({ /* data */ });
}
```

### Upgrade Subscription

```typescript
// In a Form submission
export async function action({ request }) {
  const formData = await request.formData();
  const planId = formData.get('plan');

  const subscription = await createSubscription(userId, planId);
  return json({ success: true, subscription });
}
```

## Plan Configuration

Plans are defined in `app/lib/mainlayer.server.ts`:

```typescript
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price_usd_cents: 0,
    features: ['Up to 100 API calls/month', '...'],
    resource_id: process.env.MAINLAYER_RESOURCE_FREE!,
  },
  // ... pro and enterprise
];
```

Update `MAINLAYER_RESOURCE_*` environment variables with your actual resource IDs.

## Available Endpoints

### `GET /` — Landing Page
- Public page with call-to-action

### `GET /dashboard` — User Dashboard
- Requires authentication
- Shows user profile and subscription status

### `GET /billing` — Billing Management
- Requires authentication
- Displays plans and subscription options
- Form action handles plan upgrades

## Testing

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# UI mode
npm test -- --ui
```

## API Reference

### `getPlans(): PlanConfig[]`
Returns all available plans.

### `getPlanById(planId: string): PlanConfig | undefined`
Get a specific plan by ID.

### `checkSubscription(userId: string, planId: Plan): Promise<SubscriptionStatus>`
Check if user has an active subscription for a plan.

```typescript
interface SubscriptionStatus {
  plan: Plan;
  authorized: boolean;
  subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
}
```

### `createSubscription(userId: string, planId: Plan): Promise<Subscription>`
Create a subscription for a user.

```typescript
interface Subscription {
  subscription_id: string;
  resource_id: string;
  status: 'active' | 'pending' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end?: string;
  canceled_at?: string;
}
```

### `cancelSubscription(subscriptionId: string): Promise<Subscription>`
Cancel an existing subscription.

## Deployment

### Environment Variables

Set these on your hosting platform:

```
MAINLAYER_API_KEY
MAINLAYER_API_URL
MAINLAYER_RESOURCE_FREE
MAINLAYER_RESOURCE_PRO
MAINLAYER_RESOURCE_ENTERPRISE
SESSION_SECRET
```

### Build & Start

```bash
npm run build
npm start
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Considerations

- **API Keys**: Never commit `.env.local` — use `.env.example` as template
- **User IDs**: Always verify `userId` from session before processing
- **Subscription Checks**: Validate subscription status server-side for paid features
- **Input Validation**: Use `formData.get()` with explicit type assertions

## Troubleshooting

### "MAINLAYER_API_KEY environment variable is required"

Ensure `MAINLAYER_API_KEY` is set in `.env.local`. Get it from [https://dashboard.mainlayer.fr/settings/api-keys](https://dashboard.mainlayer.fr/settings/api-keys)

### Plans not loading

Verify that `MAINLAYER_RESOURCE_*` environment variables match your actual resource IDs. Check the Mainlayer dashboard.

### Subscription creation fails

Check:
1. API key is valid and has correct permissions
2. Resource ID matches a valid resource in your Mainlayer account
3. User ID is unique and consistent

## Support

- **Mainlayer Docs**: https://docs.mainlayer.fr
- **Remix Docs**: https://remix.run/docs
- **Mainlayer Support**: https://support.mainlayer.fr

## License

MIT
