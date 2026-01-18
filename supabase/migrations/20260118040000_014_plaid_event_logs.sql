-- Plaid webhook + sync event logs (debug/observability)

create table if not exists public.plaid_webhook_events (
  id uuid primary key default gen_random_uuid(),
  trace_id text not null,
  item_id text,
  webhook_type text,
  webhook_code text,
  payload jsonb not null,
  status text not null default 'received', -- received|processed|error
  error text,
  processing_time_ms int,
  created_at timestamptz default now()
);

create index if not exists idx_plaid_webhook_events_created_at
on public.plaid_webhook_events(created_at desc);

create index if not exists idx_plaid_webhook_events_item_id
on public.plaid_webhook_events(item_id);

alter table public.plaid_webhook_events enable row level security;

-- Only service role can view/modify (debug endpoints use service role)
create policy "Service role can read plaid_webhook_events"
on public.plaid_webhook_events for select
using (auth.role() = 'service_role');

create policy "Service role can write plaid_webhook_events"
on public.plaid_webhook_events for insert
with check (auth.role() = 'service_role');

create policy "Service role can update plaid_webhook_events"
on public.plaid_webhook_events for update
using (auth.role() = 'service_role');

create table if not exists public.plaid_sync_runs (
  id uuid primary key default gen_random_uuid(),
  trace_id text not null,
  item_id text not null,
  linked_account_id uuid,
  user_id uuid,
  trigger text, -- webhook|manual|link
  webhook_code text,
  cursor_present boolean,
  added_count int default 0,
  modified_count int default 0,
  removed_count int default 0,
  inserted_or_upserted int default 0,
  has_more boolean,
  status text not null default 'ok', -- ok|error
  error text,
  created_at timestamptz default now()
);

create index if not exists idx_plaid_sync_runs_created_at
on public.plaid_sync_runs(created_at desc);

create index if not exists idx_plaid_sync_runs_item_id
on public.plaid_sync_runs(item_id);

alter table public.plaid_sync_runs enable row level security;

create policy "Service role can read plaid_sync_runs"
on public.plaid_sync_runs for select
using (auth.role() = 'service_role');

create policy "Service role can write plaid_sync_runs"
on public.plaid_sync_runs for insert
with check (auth.role() = 'service_role');
