-- =========================
-- PROFILES: user can read/update own profile
-- =========================
alter table public.profiles enable row level security;

-- Read own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Insert own profile (useful if you create it client-side)
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- Update own profile
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());


-- =========================
-- USER_CHARITIES (Goals): user can CRUD their own goals
-- =========================
alter table public.user_charities enable row level security;

-- Read own goals
create policy "user_charities_select_own"
on public.user_charities
for select
to authenticated
using (user_id = auth.uid());

-- Create own goals
create policy "user_charities_insert_own"
on public.user_charities
for insert
to authenticated
with check (user_id = auth.uid());

-- Update own goals
create policy "user_charities_update_own"
on public.user_charities
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Delete own goals
create policy "user_charities_delete_own"
on public.user_charities
for delete
to authenticated
using (user_id = auth.uid());


-- =========================
-- DONATIONS: user can READ their own donations
-- (No client-side insert/update/delete for now)
-- =========================
alter table public.donations enable row level security;

create policy "donations_select_own"
on public.donations
for select
to authenticated
using (user_id = auth.uid());
