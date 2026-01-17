-- =====================================================
-- CHANGE APP - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. PROFILES TABLE (extends auth.users)
-- Add missing columns if table exists, or create if not
DO $$
BEGIN
  -- Add donation_mode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'donation_mode'
  ) THEN
    ALTER TABLE profiles ADD COLUMN donation_mode VARCHAR(20) DEFAULT 'priority';
  END IF;
  
  -- Ensure roundup_enabled exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'roundup_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN roundup_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. CHARITIES TABLE (static list of available charities)
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo VARCHAR(10), -- emoji
  logo_url TEXT,
  website_url TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER_CHARITIES TABLE (user's selected charities with goals)
CREATE TABLE IF NOT EXISTS user_charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  goal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only have one entry per charity
  UNIQUE(user_id, charity_id)
);

-- 4. LINKED_ACCOUNTS TABLE (Plaid connections)
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id VARCHAR(255) NOT NULL,
  plaid_access_token TEXT NOT NULL,
  institution_name VARCHAR(255),
  institution_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE SET NULL,
  plaid_transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  roundup_amount DECIMAL(10, 2),
  merchant_name VARCHAR(255),
  category TEXT[],
  date DATE NOT NULL,
  is_pending BOOLEAN DEFAULT false,
  is_donation BOOLEAN DEFAULT false,
  processed_for_donation BOOLEAN DEFAULT false,
  donated_to_charity_id UUID REFERENCES charities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DONATIONS TABLE (completed donation batches)
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id),
  amount DECIMAL(10, 2) NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_charities_user_id ON user_charities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_charities_priority ON user_charities(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Charities: Everyone can read, only admins can modify
CREATE POLICY "Charities are viewable by everyone" ON charities
  FOR SELECT USING (true);

-- User Charities: Users can only access their own
CREATE POLICY "Users can view own charities" ON user_charities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own charities" ON user_charities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own charities" ON user_charities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own charities" ON user_charities
  FOR DELETE USING (auth.uid() = user_id);

-- Linked Accounts: Users can only access their own
CREATE POLICY "Users can view own linked accounts" ON linked_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own linked accounts" ON linked_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own linked accounts" ON linked_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own linked accounts" ON linked_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions: Users can only access their own
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Donations: Users can only access their own
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Default charities
-- =====================================================
INSERT INTO charities (id, name, description, logo, category, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Local Food Bank', 'Fighting hunger in your local community', '🍎', 'hunger', true),
  ('22222222-2222-2222-2222-222222222222', 'Clean Water Initiative', 'Providing clean water to communities in need', '💧', 'water', true),
  ('33333333-3333-3333-3333-333333333333', 'Education For All', 'Supporting education in underserved areas', '📚', 'education', true),
  ('44444444-4444-4444-4444-444444444444', 'Animal Rescue League', 'Saving and caring for abandoned animals', '🐾', 'animals', true),
  ('55555555-5555-5555-5555-555555555555', 'Environmental Defense', 'Protecting our planet for future generations', '🌍', 'environment', true),
  ('66666666-6666-6666-6666-666666666666', 'Mental Health Support', 'Providing resources for mental wellness', '🧠', 'health', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo = EXCLUDED.logo,
  category = EXCLUDED.category;

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_completed, roundup_enabled, donation_mode)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    true,
    'priority'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
