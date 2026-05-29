-- Phase 3: Certificates Tables

-- Certificate Templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}',
  background_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_templates
CREATE POLICY "Organizers can manage certificate templates"
ON public.certificate_templates
FOR ALL
USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Public can view templates for published events"
ON public.certificate_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = certificate_templates.event_id
    AND events.status = 'published'
  )
);

-- RLS Policies for certificates
CREATE POLICY "Users can view own certificates"
ON public.certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = certificates.registration_id
    AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

CREATE POLICY "Organizers can manage certificates"
ON public.certificates
FOR ALL
USING (is_event_organizer(auth.uid(), event_id));

-- Indexes for performance
CREATE INDEX idx_certificates_event_id ON public.certificates(event_id);
CREATE INDEX idx_certificates_registration_id ON public.certificates(registration_id);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificate_templates_event_id ON public.certificate_templates(event_id);

-- Trigger for updated_at on certificate_templates
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();