create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Placeholder for now (will become FK to public.charities(id) later)
  charity_id uuid not null,

  -- Optional link to the active/selected goal
  user_charity_id uuid references public.user_charities(id),

  -- Placeholder for now (will become FK to public.transactions(id) later)
  transaction_id uuid,

  amount numeric(10,2) not null,
  status text default 'completed',
  created_at timestamptz default now(),

  constraint donations_amount_positive check (amount > 0),
  constraint donations_status_valid check (status in ('completed', 'pending', 'failed'))
);
