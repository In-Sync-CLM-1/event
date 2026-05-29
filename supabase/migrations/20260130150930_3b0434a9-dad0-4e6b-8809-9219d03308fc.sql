-- Create invitations table for SDR referral tracking
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  invitee_email TEXT,
  invitee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'registered', 'checked_in')),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_shares table for tracking shared content
CREATE TABLE public.content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_library(id) ON DELETE CASCADE,
  sharer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  share_token TEXT NOT NULL UNIQUE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_invitations_event_id ON public.invitations(event_id);
CREATE INDEX idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX idx_invitations_referral_code ON public.invitations(referral_code);
CREATE INDEX idx_content_shares_sharer_id ON public.content_shares(sharer_id);
CREATE INDEX idx_content_shares_share_token ON public.content_shares(share_token);

-- RLS Policies for invitations
CREATE POLICY "SDRs can view own invitations"
ON public.invitations
FOR SELECT
USING (inviter_id = auth.uid());

CREATE POLICY "SDRs can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "SDRs can update own invitations"
ON public.invitations
FOR UPDATE
USING (inviter_id = auth.uid());

CREATE POLICY "Organizers can view all event invitations"
ON public.invitations
FOR SELECT
USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Organizers can manage event invitations"
ON public.invitations
FOR ALL
USING (is_event_organizer(auth.uid(), event_id));

-- RLS Policies for content_shares
CREATE POLICY "Users can view own shares"
ON public.content_shares
FOR SELECT
USING (sharer_id = auth.uid());

CREATE POLICY "Users can create shares"
ON public.content_shares
FOR INSERT
WITH CHECK (sharer_id = auth.uid());

CREATE POLICY "Public can view by share token"
ON public.content_shares
FOR SELECT
USING (true);

CREATE POLICY "Users can update own shares"
ON public.content_shares
FOR UPDATE
USING (sharer_id = auth.uid());

-- Trigger for updated_at on invitations
CREATE TRIGGER update_invitations_updated_at
BEFORE UPDATE ON public.invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();