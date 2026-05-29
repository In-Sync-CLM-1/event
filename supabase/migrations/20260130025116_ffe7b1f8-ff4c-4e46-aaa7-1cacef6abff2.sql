-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('super_admin', 'event_manager', 'staff', 'attendee');

-- Create event_status enum
CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- Create registration_status enum
CREATE TYPE public.registration_status AS ENUM ('pending', 'confirmed', 'waitlisted', 'cancelled', 'checked_in');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  designation TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  address TEXT,
  city TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  max_capacity INTEGER,
  banner_url TEXT,
  logo_url TEXT,
  status event_status DEFAULT 'draft' NOT NULL,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create event_organizers junction table for multi-organizer support
CREATE TABLE public.event_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'staff' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create speakers table
CREATE TABLE public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  bio TEXT,
  photo_url TEXT,
  social_links JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create sessions/agenda table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  track TEXT,
  max_capacity INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create session_speakers junction table
CREATE TABLE public.session_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  speaker_id UUID REFERENCES public.speakers(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(session_id, speaker_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  designation TEXT,
  status registration_status DEFAULT 'pending' NOT NULL,
  custom_fields JSONB DEFAULT '{}',
  qr_code TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create check_ins table for detailed attendance tracking
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES auth.users(id),
  method TEXT DEFAULT 'qr_scan',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  tier TEXT DEFAULT 'bronze',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is event organizer
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
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles policies (only super admins can manage)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Events policies
CREATE POLICY "Published events are public"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Organizers can view all their events"
  ON public.events FOR SELECT
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), id) OR created_by = auth.uid());

CREATE POLICY "Organizers can manage their events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), id) OR created_by = auth.uid());

-- Event organizers policies
CREATE POLICY "Organizers can view event team"
  ON public.event_organizers FOR SELECT
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Event managers can manage team"
  ON public.event_organizers FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

-- Speakers policies
CREATE POLICY "Public can view speakers for published events"
  ON public.speakers FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND status = 'published'
  ));

CREATE POLICY "Organizers can manage speakers"
  ON public.speakers FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

-- Sessions policies
CREATE POLICY "Public can view sessions for published events"
  ON public.sessions FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND status = 'published'
  ));

CREATE POLICY "Organizers can manage sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

-- Session speakers policies
CREATE POLICY "Public can view session speakers"
  ON public.session_speakers FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.events e ON s.event_id = e.id
    WHERE s.id = session_id AND e.status = 'published'
  ));

CREATE POLICY "Organizers can manage session speakers"
  ON public.session_speakers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id AND public.is_event_organizer(auth.uid(), s.event_id)
  ));

-- Registrations policies
CREATE POLICY "Anyone can register for published events"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND status = 'published'
  ));

CREATE POLICY "Users can view own registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Organizers can view all registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Organizers can manage registrations"
  ON public.registrations FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

-- Check-ins policies
CREATE POLICY "Organizers can manage check-ins"
  ON public.check_ins FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Users can view own check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  ));

-- Sponsors policies
CREATE POLICY "Public can view sponsors for published events"
  ON public.sponsors FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND status = 'published'
  ));

CREATE POLICY "Organizers can manage sponsors"
  ON public.sponsors FOR ALL
  TO authenticated
  USING (public.is_event_organizer(auth.uid(), event_id));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_speakers_updated_at
  BEFORE UPDATE ON public.speakers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX idx_registrations_email ON public.registrations(email);
CREATE INDEX idx_registrations_number ON public.registrations(registration_number);
CREATE INDEX idx_sessions_event_id ON public.sessions(event_id);
CREATE INDEX idx_speakers_event_id ON public.speakers(event_id);
CREATE INDEX idx_check_ins_registration ON public.check_ins(registration_id);
CREATE INDEX idx_check_ins_event ON public.check_ins(event_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);