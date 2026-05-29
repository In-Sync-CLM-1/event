-- Allow authenticated users to insert check-ins for their own registrations (self check-in)
CREATE POLICY "Attendees can self check-in"
ON public.check_ins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id
      AND r.email = public.auth_email()
      AND r.event_id = check_ins.event_id
      AND r.status IN ('confirmed', 'pending')
  )
  OR public.is_event_organizer(auth.uid(), event_id)
);

-- Also allow attendees to read their own check-ins
CREATE POLICY "Attendees can view own check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id
      AND r.email = public.auth_email()
  )
  OR public.is_event_organizer(auth.uid(), event_id)
);

-- Allow attendees to update their own registration status (for check-in status update)
-- Check if policy already exists first - using CREATE OR REPLACE via drop+create pattern
DO $$
BEGIN
  -- Allow self-status-update for check-in
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Attendees can update own registration for checkin' AND tablename = 'registrations'
  ) THEN
    CREATE POLICY "Attendees can update own registration for checkin"
    ON public.registrations
    FOR UPDATE
    TO authenticated
    USING (email = public.auth_email())
    WITH CHECK (email = public.auth_email());
  END IF;
END $$;