-- Change App Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extended user data (linked to auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  onboarding_completed boolean default false,
  selected_charity_id uuid,
  roundup_enabled boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CHARITIES TABLE
-- Available charities for donations
-- ============================================
create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  website_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.charities enable row level security;

-- Everyone can view active charities
create policy "Anyone can view active charities"
  on public.charities for select
  using (is_active = true);

-- Add foreign key to profiles
alter table public.profiles
  add constraint profiles_selected_charity_fkey
  foreign key (selected_charity_id) references public.charities(id);

-- ============================================
-- LINKED ACCOUNTS TABLE
-- Plaid-linked bank accounts
-- ============================================
create table public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plaid_item_id text unique not null,
  plaid_access_token text not null,
  institution_name text,
  institution_id text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.linked_accounts enable row level security;

-- Users can only see/modify their own linked accounts
create policy "Users can view own linked accounts"
  on public.linked_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own linked accounts"
  on public.linked_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own linked accounts"
  on public.linked_accounts for update
  using (auth.uid() = user_id);

-- ============================================
-- TRANSACTIONS TABLE
-- Synced transactions from Plaid
-- ============================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  linked_account_id uuid references public.linked_accounts(id) on delete cascade,
  plaid_transaction_id text unique not null,
  amount numeric(10,2) not null,
  roundup_amount numeric(10,2),
  merchant_name text,
  category text[],
  date date not null,
  is_donation boolean default false,
  is_pending boolean default false,
  processed_for_donation boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Users can only see their own transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Index for efficient queries
create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_date_idx on public.transactions(date desc);
create index transactions_processed_idx on public.transactions(user_id, processed_for_donation) 
  where processed_for_donation = false;

-- ============================================
-- DONATIONS TABLE
-- Aggregated round-up donations
-- ============================================
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) not null,
  amount numeric(10,2) not null,
  transaction_count int not null default 0,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.donations enable row level security;

-- Users can only see their own donations
create policy "Users can view own donations"
  on public.donations for select
  using (auth.uid() = user_id);

-- Index for efficient queries
create index donations_user_id_idx on public.donations(user_id);
create index donations_status_idx on public.donations(status);

-- ============================================
-- SEED DATA: Sample Charities
-- ============================================
insert into public.charities (name, description, logo_url, is_active) values
  ('Local Food Bank', 'Fighting hunger in your local community by providing meals to families in need.', null, true),
  ('Clean Water Initiative', 'Providing clean, safe drinking water to communities around the world.', null, true),
  ('Education For All', 'Supporting education in underserved areas through scholarships and school supplies.', null, true),
  ('Animal Rescue League', 'Saving and caring for abandoned and abused animals.', null, true),
  ('Environmental Defense Fund', 'Protecting our planet for future generations through conservation efforts.', null, true),
  ('Mental Health Support Network', 'Providing resources and support for mental wellness.', null, true);
