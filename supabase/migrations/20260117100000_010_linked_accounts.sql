-- Linked bank accounts via Plaid
create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Plaid identifiers
  plaid_item_id text unique not null,
  plaid_access_token text not null,
  
  -- Institution info
  institution_name text,
  institution_id text,
  
  -- Account status
  is_active boolean default true,
  last_synced_at timestamptz,
  sync_cursor text, -- For incremental transaction sync
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists idx_linked_accounts_user_id 
on public.linked_accounts(user_id);

create index if not exists idx_linked_accounts_item_id 
on public.linked_accounts(plaid_item_id);

-- RLS policies
alter table public.linked_accounts enable row level security;

create policy "Users can view their own linked accounts"
on public.linked_accounts for select
using (auth.uid() = user_id);

create policy "Users can insert their own linked accounts"
on public.linked_accounts for insert
with check (auth.uid() = user_id);

create policy "Users can update their own linked accounts"
on public.linked_accounts for update
using (auth.uid() = user_id);

create policy "Users can delete their own linked accounts"
on public.linked_accounts for delete
using (auth.uid() = user_id);
