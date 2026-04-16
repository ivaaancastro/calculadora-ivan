-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: Aligned Profiles Schema & Flexible Settings
-- ─────────────────────────────────────────────────────────────────────────────
-- This migration ensures the profiles table has the correct column names for 
-- Intervals.icu sync and a generic 'user_settings' JSONB for future tweaks.
-- Run this in your Supabase SQL Editor.

-- 1. Ensure core calibration and sync columns exist with aligned names
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS intervals_athlete_id TEXT,
  ADD COLUMN IF NOT EXISTS intervals_api_key TEXT,
  ADD COLUMN IF NOT EXISTS intervals_last_synced TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_settings JSONB DEFAULT '{}';

-- 2. Clean up: (Optional) If you had old camelCase columns that failed, 
-- you can uncomment these to remove them, but IF NOT EXISTS above is safer.
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS "intervalsId";
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS "intervalsKey";
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS "ctl_offset";

COMMENT ON COLUMN public.profiles.user_settings IS 'Flexible JSON blob for dashboard preferences, UI states, and performance offsets like offsetCtl.';

SELECT 'Profile schema correctly aligned! ✓' as status;
