-- Migration: Change charity_id columns from uuid to text
-- Reason: External charity APIs (like GlobalGiving) use numerical IDs as strings,
-- not UUIDs. This allows us to store and reference external charity IDs directly.

-- ============================================
-- DROP FOREIGN KEY CONSTRAINTS (if they exist)
-- ============================================

-- Drop FK from profiles.selected_charity_id -> charities.id
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_selected_charity_fkey;

-- Drop FK from donations.charity_id -> charities.id
ALTER TABLE public.donations 
  DROP CONSTRAINT IF EXISTS donations_charity_id_fkey;

-- Drop any other potential FK constraints on user_charities
ALTER TABLE public.user_charities 
  DROP CONSTRAINT IF EXISTS user_charities_charity_id_fkey;

-- ============================================
-- DROP INDEXES THAT DEPEND ON THESE COLUMNS
-- (They'll be recreated after type change)
-- ============================================

DROP INDEX IF EXISTS idx_profiles_selected_charity;

-- ============================================
-- CHANGE COLUMN TYPES TO TEXT
-- ============================================

-- Change profiles.selected_charity_id from uuid to text
ALTER TABLE public.profiles
  ALTER COLUMN selected_charity_id TYPE text;

-- Change user_charities.charity_id from uuid to text
ALTER TABLE public.user_charities
  ALTER COLUMN charity_id TYPE text;

-- Change donations.charity_id from uuid to text
ALTER TABLE public.donations
  ALTER COLUMN charity_id TYPE text;

-- ============================================
-- RECREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_selected_charity 
  ON public.profiles(selected_charity_id) 
  WHERE selected_charity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_charities_charity_id
  ON public.user_charities(charity_id);

CREATE INDEX IF NOT EXISTS idx_donations_charity_id
  ON public.donations(charity_id);

-- ============================================
-- NOTE: The charities table does not exist in the current schema.
-- Charity data comes directly from the GlobalGiving API, so we 
-- store external charity IDs (numerical strings) without a local
-- charities table or foreign key constraints.
-- ============================================
