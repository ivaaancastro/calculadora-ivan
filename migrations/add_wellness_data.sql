-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Create wellness_data table for Intervals.icu / Garmin sync
-- Run this ONCE in Supabase SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. wellness_data table
CREATE TABLE IF NOT EXISTS wellness_data (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date            DATE        NOT NULL,

  -- Heart rate & HRV (from Garmin via Intervals.icu)
  hrv             FLOAT,          -- Overnight avg HRV (Garmin: rMSSD in ms)
  hrv_sdnn        FLOAT,          -- HRV SDNN metric (ms)
  resting_hr      INTEGER,        -- Resting heart rate (bpm)
  avg_sleeping_hr FLOAT,          -- Average HR while sleeping

  -- Body metrics
  weight          FLOAT,          -- Weight (kg)
  body_fat        FLOAT,          -- Body fat percentage

  -- Sleep
  sleep_secs      INTEGER,        -- Total sleep duration (seconds)
  sleep_score     FLOAT,          -- Sleep quality score (0-100)
  sleep_quality   INTEGER,        -- Garmin sleep quality category

  -- Fitness & performance
  vo2max          FLOAT,          -- Garmin Firstbeat VO2max estimate
  readiness       FLOAT,          -- Intervals.icu readiness score (0-100)
  ctl             FLOAT,          -- Chronic Training Load (fitness) from intervals.icu
  atl             FLOAT,          -- Acute Training Load (fatigue) from intervals.icu

  -- Activity
  steps           INTEGER,        -- Daily steps
  spo2            FLOAT,          -- Blood oxygen saturation (%)
  respiration     FLOAT,          -- Breathing rate (breaths/min)

  -- Subjective wellness
  stress          INTEGER,        -- Garmin stress score
  soreness        INTEGER,        -- Muscle soreness (1-5)

  -- Metadata
  source          TEXT        DEFAULT 'intervals',
  synced_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id, date)
);

-- 2. Row Level Security
ALTER TABLE wellness_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own wellness data" ON wellness_data;
CREATE POLICY "Users can manage their own wellness data"
  ON wellness_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Index for fast date queries per user
CREATE INDEX IF NOT EXISTS wellness_data_user_date_idx ON wellness_data (user_id, date DESC);

-- 4. Add Intervals.icu columns to profiles (safe - IF NOT EXISTS)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intervals_athlete_id TEXT,
  ADD COLUMN IF NOT EXISTS intervals_api_key TEXT,
  ADD COLUMN IF NOT EXISTS intervals_last_synced TIMESTAMPTZ;

-- Verify
SELECT 'wellness_data table created ✓' AS status;
