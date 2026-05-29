
-- Step 1: Create helper function
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() ->> 'email')::text;
$$;

-- Step 2: Fix registrations policies
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations" ON public.registrations
  FOR SELECT USING (email = public.auth_email() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can register" ON public.registrations;
CREATE POLICY "Users can register" ON public.registrations
  FOR INSERT WITH CHECK (email = public.auth_email() OR user_id = auth.uid());

-- Step 3: Fix attendee_schedules policies
DROP POLICY IF EXISTS "Users can manage own schedule" ON public.attendee_schedules;
CREATE POLICY "Users can manage own schedule" ON public.attendee_schedules
  FOR ALL USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view own schedule" ON public.attendee_schedules;
CREATE POLICY "Users can view own schedule" ON public.attendee_schedules
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 4: Fix badge_awards policies
DROP POLICY IF EXISTS "Users can view own badge awards" ON public.badge_awards;
CREATE POLICY "Users can view own badge awards" ON public.badge_awards
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 5: Fix certificates policies
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 6: Fix check_ins policies
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 7: Fix content_library policies
DROP POLICY IF EXISTS "Registered users can view gated content" ON public.content_library;
CREATE POLICY "Registered users can view gated content" ON public.content_library
  FOR SELECT USING (
    is_gated = false OR EXISTS (
      SELECT 1 FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid()
    )
  );

-- Step 8: Fix content_views policies
DROP POLICY IF EXISTS "Users can track own content views" ON public.content_views;
CREATE POLICY "Users can track own content views" ON public.content_views
  FOR ALL USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 9: Fix engagement_scores policies
DROP POLICY IF EXISTS "Users can view own engagement score" ON public.engagement_scores;
CREATE POLICY "Users can view own engagement score" ON public.engagement_scores
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 10: Fix meeting_bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.meeting_bookings;
CREATE POLICY "Users can view own bookings" ON public.meeting_bookings
  FOR SELECT USING (
    requester_registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
    OR target_registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create bookings" ON public.meeting_bookings;
CREATE POLICY "Users can create bookings" ON public.meeting_bookings
  FOR INSERT WITH CHECK (
    requester_registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own bookings" ON public.meeting_bookings;
CREATE POLICY "Users can update own bookings" ON public.meeting_bookings
  FOR UPDATE USING (
    requester_registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
    OR target_registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 11: Fix meeting_requests policies
DROP POLICY IF EXISTS "Users can manage own meeting requests" ON public.meeting_requests;
CREATE POLICY "Users can manage own meeting requests" ON public.meeting_requests
  FOR ALL USING (
    requester_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
    OR target_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 12: Fix points_log policies
DROP POLICY IF EXISTS "Users can view own points" ON public.points_log;
CREATE POLICY "Users can view own points" ON public.points_log
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

-- Step 13: Fix reward_claims policies
DROP POLICY IF EXISTS "Users can view own claims" ON public.reward_claims;
CREATE POLICY "Users can view own claims" ON public.reward_claims
  FOR SELECT USING (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can claim rewards" ON public.reward_claims;
CREATE POLICY "Users can claim rewards" ON public.reward_claims
  FOR INSERT WITH CHECK (
    registration_id IN (SELECT id FROM public.registrations WHERE email = public.auth_email() OR user_id = auth.uid())
  );
