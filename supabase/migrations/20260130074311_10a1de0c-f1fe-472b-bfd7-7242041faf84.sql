-- Phase 2: Attendee Schedules table for personal agenda
CREATE TABLE public.attendee_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(registration_id, session_id)
);

-- Enable RLS
ALTER TABLE public.attendee_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendee_schedules
CREATE POLICY "Users can view own schedule"
ON public.attendee_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = attendee_schedules.registration_id
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Users can manage own schedule"
ON public.attendee_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = attendee_schedules.registration_id
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Organizers can view all schedules"
ON public.attendee_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = attendee_schedules.session_id
    AND is_event_organizer(auth.uid(), s.event_id)
  )
);

-- Create event-assets storage bucket for speaker photos and presentations
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-assets', 'event-assets', true);

-- Storage policies for event-assets bucket
CREATE POLICY "Public can view event assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-assets');

CREATE POLICY "Authenticated users can upload event assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own event assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own event assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');