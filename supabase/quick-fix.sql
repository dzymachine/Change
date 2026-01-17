-- =====================================================
-- QUICK FIX: Add charity info columns to user_charities
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add charity_name and charity_logo columns to user_charities
-- This allows us to store GlobalGiving charity info directly
ALTER TABLE user_charities 
ADD COLUMN IF NOT EXISTS charity_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS charity_logo TEXT,
ADD COLUMN IF NOT EXISTS charity_image_url TEXT;

-- 2. Change charity_id to TEXT to support GlobalGiving IDs (not UUIDs)
-- First drop the foreign key constraint if it exists
ALTER TABLE user_charities DROP CONSTRAINT IF EXISTS user_charities_charity_id_fkey;

-- Change the column type to TEXT
ALTER TABLE user_charities ALTER COLUMN charity_id TYPE TEXT USING charity_id::TEXT;

-- 3. Make sure the required columns exist on profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS donation_mode VARCHAR(20) DEFAULT 'priority',
ADD COLUMN IF NOT EXISTS roundup_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS selected_charity_id TEXT;

-- 4. Ensure RLS is set up for user_charities
ALTER TABLE user_charities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own charities" ON user_charities;
DROP POLICY IF EXISTS "Users can insert own charities" ON user_charities;
DROP POLICY IF EXISTS "Users can update own charities" ON user_charities;
DROP POLICY IF EXISTS "Users can delete own charities" ON user_charities;

-- Create policies
CREATE POLICY "Users can view own charities" ON user_charities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own charities" ON user_charities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own charities" ON user_charities
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own charities" ON user_charities
  FOR DELETE USING (auth.uid() = user_id);
