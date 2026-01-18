-- Migration: Change transactions.donated_to_charity_id from uuid to text
-- Reason: External charity APIs (like GlobalGiving) use numerical IDs as strings,
-- not UUIDs. This was missed in migration 012.

-- Change transactions.donated_to_charity_id from uuid to text
ALTER TABLE public.transactions
  ALTER COLUMN donated_to_charity_id TYPE text;

-- Add an index for querying by charity
CREATE INDEX IF NOT EXISTS idx_transactions_donated_to_charity
  ON public.transactions(donated_to_charity_id)
  WHERE donated_to_charity_id IS NOT NULL;
