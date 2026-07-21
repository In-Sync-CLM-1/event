-- Per-event investment figure for the ROI view. Entered by organizers
-- (venue + marketing + production, all-in); NULL means "not tracked yet".
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_spend numeric;
COMMENT ON COLUMN public.events.total_spend IS 'All-in event spend in INR, entered by the organizer; drives cost-per-lead on the Performance page';
