-- Create meeting_spots table for physical locations where meetings happen
CREATE TABLE public.meeting_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  capacity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create meeting_bookings table for actual booked meetings with outcomes
CREATE TABLE public.meeting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  spot_id uuid REFERENCES public.meeting_spots(id) ON DELETE SET NULL,
  requester_registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  target_registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  scheduled_start timestamp with time zone,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes IN (10, 20, 30)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'declined')),
  outcome_notes text,
  outcome_rating integer CHECK (outcome_rating IS NULL OR (outcome_rating >= 1 AND outcome_rating <= 5)),
  topics_discussed text[],
  follow_up_required boolean DEFAULT false,
  message text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_spots
CREATE POLICY "Public can view active spots for published events"
ON public.meeting_spots
FOR SELECT
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = meeting_spots.event_id
    AND events.status = 'published'
  )
);

CREATE POLICY "Organizers can manage meeting spots"
ON public.meeting_spots
FOR ALL
USING (is_event_organizer(auth.uid(), event_id));

-- RLS Policies for meeting_bookings
CREATE POLICY "Users can view own bookings"
ON public.meeting_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE (r.id = meeting_bookings.requester_registration_id OR r.id = meeting_bookings.target_registration_id)
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
  )
);

CREATE POLICY "Users can create booking requests"
ON public.meeting_bookings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = meeting_bookings.requester_registration_id
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
  )
);

CREATE POLICY "Users can update own bookings"
ON public.meeting_bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE (r.id = meeting_bookings.requester_registration_id OR r.id = meeting_bookings.target_registration_id)
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
  )
);

CREATE POLICY "Organizers can manage all bookings"
ON public.meeting_bookings
FOR ALL
USING (is_event_organizer(auth.uid(), event_id));

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_bookings_updated_at
BEFORE UPDATE ON public.meeting_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_meeting_spots_event_id ON public.meeting_spots(event_id);
CREATE INDEX idx_meeting_bookings_event_id ON public.meeting_bookings(event_id);
CREATE INDEX idx_meeting_bookings_requester ON public.meeting_bookings(requester_registration_id);
CREATE INDEX idx_meeting_bookings_target ON public.meeting_bookings(target_registration_id);
CREATE INDEX idx_meeting_bookings_status ON public.meeting_bookings(status);