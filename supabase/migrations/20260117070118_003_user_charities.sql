create table if not exists public.user_charities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Placeholder for now (will become FK to public.charities(id) later)
  charity_id uuid not null,

  goal_amount numeric(10,2) not null,
  current_amount numeric(10,2) default 0,

  priority int not null,

  is_completed boolean default false,
  completed_at timestamptz,

  created_at timestamptz default now(),

  constraint user_charities_goal_amount_positive check (goal_amount > 0),
  constraint user_charities_current_amount_nonnegative check (current_amount >= 0),
  constraint user_charities_priority_positive check (priority > 0)
);
