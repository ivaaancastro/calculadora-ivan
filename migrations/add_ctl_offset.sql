-- Added: CTL Offset for perfectly aligning the PMC with Intervals.icu without full historical data

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ctl_offset NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.profiles.ctl_offset IS 'Flat offset to shift the user CTL globally and match third-party data platforms';
