
-- Allow anonymous users to register for events
DROP POLICY IF EXISTS "Users can register" ON public.registrations;
CREATE POLICY "Users can register" ON public.registrations
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
