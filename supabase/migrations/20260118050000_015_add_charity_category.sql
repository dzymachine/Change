-- Add charity_category column to user_charities for displaying category info
-- This stores the primary category (e.g., "Local", "Health", "Education")
ALTER TABLE user_charities 
ADD COLUMN IF NOT EXISTS charity_category VARCHAR(50);
