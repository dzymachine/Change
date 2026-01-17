-- Active goals lookup: WHERE user_id=? AND is_completed=false ORDER BY priority ASC
create index if not exists idx_user_charities_active_priority
  on public.user_charities (user_id, is_completed, priority);

-- Completed goals lookup: WHERE user_id=? AND is_completed=true ORDER BY completed_at DESC
create index if not exists idx_user_charities_completed_at
  on public.user_charities (user_id, is_completed, completed_at desc);

-- Donations: common user timeline queries
create index if not exists idx_donations_user_created_at
  on public.donations (user_id, created_at desc);

-- Donations: link back to transaction quickly (placeholder column exists)
create index if not exists idx_donations_transaction_id
  on public.donations (transaction_id);

-- Donations: link back to goal quickly
create index if not exists idx_donations_user_charity_id
  on public.donations (user_charity_id);

-- Donations by charity (useful for dashboards)
create index if not exists idx_donations_charity_id
  on public.donations (charity_id);
