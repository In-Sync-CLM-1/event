-- Update has_role() so platform_admin passes any role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'platform_admin')
  )
$$;

-- Helper: quick platform admin check
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

-- Update is_event_organizer so platform_admin has full access
CREATE OR REPLACE FUNCTION public.is_event_organizer(_user_id UUID, _event_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_organizers
    WHERE user_id = _user_id AND event_id = _event_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'platform_admin')
  )
$$;

-- Platform admin can read all profiles
CREATE POLICY "Platform admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Platform admin full access to user_roles
CREATE POLICY "Platform admin can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform admin full access to events
CREATE POLICY "Platform admin can manage all events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Platform admin can view all registrations
CREATE POLICY "Platform admin can view all registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- Platform admin can view all check-ins
CREATE POLICY "Platform admin can view all check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (public.is_platform_admin(auth.uid()));
