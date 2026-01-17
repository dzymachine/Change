-- Transactions from Plaid
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  linked_account_id uuid references public.linked_accounts(id) on delete cascade not null,
  
  -- Plaid transaction ID (unique per transaction)
  plaid_transaction_id text unique not null,
  
  -- Transaction details
  amount numeric(10,2) not null,
  roundup_amount numeric(10,2) not null,
  merchant_name text,
  category text[],
  date date not null,
  
  -- Status flags
  is_pending boolean default false,
  is_donation boolean default false, -- True if this is our own donation transaction
  processed_for_donation boolean default false, -- True if round-up has been added to charity
  
  -- Which charity received this round-up (null until processed)
  donated_to_charity_id uuid,
  donation_id uuid references public.donations(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_transactions_user_id 
on public.transactions(user_id);

create index if not exists idx_transactions_linked_account 
on public.transactions(linked_account_id);

create index if not exists idx_transactions_unprocessed 
on public.transactions(user_id, processed_for_donation) 
where processed_for_donation = false;

create index if not exists idx_transactions_date 
on public.transactions(user_id, date desc);

-- RLS policies
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
on public.transactions for select
using (auth.uid() = user_id);

-- Only service role can insert/update/delete transactions (via webhook)
create policy "Service role can manage transactions"
on public.transactions for all
using (auth.role() = 'service_role');
