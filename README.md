# Change.

Small donations that add up. Change connects a user's bank account, rounds up everyday purchases, and allocates the spare change toward charitable goals the user sets.

## Product Overview

### Problem
Most people want to give back, but regular donations are easy to forget and hard to budget. Small, automatic contributions make it effortless to support causes consistently.

### Solution
Change turns everyday spending into impact:
- Link a bank account via Plaid.
- Pick charities and set goals.
- Automatically round up eligible purchases and allocate the change.
- Celebrate when a goal is completed.

### Key Features
- Onboarding flow for charity selection and goal setting.
- Donation modes: priority (fill goals in order) or random (spread impact).
- Charity discovery with filters and curated lists.
- Transaction roundup tracking and donation batching.
- Goal completion emails.

## Architecture

### System Components
- **Frontend**: Next.js App Router UI for onboarding, dashboard, and settings.
- **Backend**: Next.js Route Handlers for API endpoints and webhooks.
- **Database**: Supabase Postgres for users, charities, goals, transactions, and donations.
- **Integrations**:
  - Plaid for bank account linking and transaction syncing.
  - GlobalGiving for featured charity data.
  - SMTP (Nodemailer) for email notifications.

### Data Flow
1) User links their bank account via Plaid Link.
2) Plaid transactions are synced and stored in Supabase.
3) Each transaction is rounded up and allocated based on the user's donation mode.
4) When a charity goal is completed, an email is sent.
5) Donations can be batched once thresholds are met.

### Core Modules
- `lib/plaid/*`: Plaid client and sync utilities.
- `lib/donations/*`: Round-up calculation, allocation, and batching.
- `lib/charities/data.ts`: Curated and local charities.
- `lib/email/sendDonationEmail.ts`: Goal completion emails.

### API Endpoints (selected)
- `app/api/plaid/create-link-token/route.ts`: Plaid Link init.
- `app/api/plaid/exchange-token/route.ts`: Exchange public token.
- `app/api/plaid/webhook/route.ts`: Plaid webhooks.
- `app/api/charities/route.ts`: Charity feed (curated + GlobalGiving).

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Supabase (Auth + Postgres)
- Plaid
- GlobalGiving API
- Tailwind CSS
- Nodemailer

## Local Development

```bash
npm install
npm run dev
```

### Environment Variables
Set these in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV`
- `PLAID_WEBHOOK_URL`
- `GLOBALGIVING_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`

## Notes for Devpost
- This repo contains both product UX and the full transaction-to-donation pipeline.
