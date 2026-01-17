create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  onboarding_completed boolean default false,
  roundup_enabled boolean default true,
  donation_mode text default 'priority' check (donation_mode in ('priority', 'random')),
  created_at timestamptz default now()
);
