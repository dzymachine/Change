-- Add selected_charity_id to profiles for tracking current charity selection
-- This is a simple FK that stores which charity the user is currently donating to

alter table public.profiles
add column if not exists selected_charity_id uuid;

-- Note: We're not adding a FK constraint to charities table yet since charities
-- table might not be fully set up. This can be added later when charities are seeded.
-- For now, the mock charity IDs will be stored as UUIDs.

-- Index for faster lookups
create index if not exists idx_profiles_selected_charity 
on public.profiles(selected_charity_id) 
where selected_charity_id is not null;
