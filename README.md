![CI](https://github.com/your-org/remix-saas-mainlayer/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

# remix-saas-mainlayer

Remix v2 SaaS boilerplate with Mainlayer subscription billing — free, pro, and enterprise plans out of the box.

## Installation

```bash
npx create-remix@latest --template your-org/remix-saas-mainlayer
```

## Quickstart

```bash
cp .env.example .env          # Add MAINLAYER_API_KEY and SESSION_SECRET
npm install
npm run dev                   # http://localhost:5173
```

Set the following environment variables:

| Variable | Description |
|---|---|
| `MAINLAYER_API_KEY` | Your Mainlayer secret key |
| `SESSION_SECRET` | Random string for cookie signing |
| `MAINLAYER_PRO_RESOURCE_ID` | Resource ID for Pro plan |
| `MAINLAYER_ENTERPRISE_RESOURCE_ID` | Resource ID for Enterprise plan |

## Features

- Remix v2 with Vite
- Session-based authentication (cookie)
- Mainlayer subscription plans (free / pro / enterprise)
- Billing dashboard with plan upgrade + portal
- Protected routes via `requireUserId`
- Vitest test suite

📚 Docs at [mainlayer.fr](https://mainlayer.fr)
