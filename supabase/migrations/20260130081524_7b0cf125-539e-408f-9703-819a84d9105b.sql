-- Phase 4: Gamification Tables

-- Points log for tracking all point transactions
CREATE TABLE public.points_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badges definition
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB DEFAULT '{}'::jsonb,
  points_value INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badge awards to attendees
CREATE TABLE public.badge_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(badge_id, registration_id)
);

-- Rewards catalog
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER,
  claimed_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reward claims by attendees
CREATE TABLE public.reward_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled BOOLEAN DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES auth.users(id)
);

-- Phase 5: Advanced Features Tables

-- Engagement scores
CREATE TABLE public.engagement_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'passive',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  breakdown JSONB DEFAULT '{}'::jsonb,
  UNIQUE(event_id, registration_id)
);

-- Meeting slots for 1:1 networking
CREATE TABLE public.meeting_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meeting requests between attendees
CREATE TABLE public.meeting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES public.meeting_slots(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content library for session recordings and materials
CREATE TABLE public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_gated BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content view tracking
CREATE TABLE public.content_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content_library(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0
);

-- Enable RLS on all new tables
ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_log
CREATE POLICY "Organizers can manage points" ON public.points_log
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Users can view own points" ON public.points_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = points_log.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- RLS Policies for badges
CREATE POLICY "Organizers can manage badges" ON public.badges
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Public can view badges for published events" ON public.badges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = badges.event_id AND status = 'published')
  );

-- RLS Policies for badge_awards
CREATE POLICY "Organizers can manage badge awards" ON public.badge_awards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM badges b
      WHERE b.id = badge_awards.badge_id
      AND is_event_organizer(auth.uid(), b.event_id)
    )
  );

CREATE POLICY "Users can view own badge awards" ON public.badge_awards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = badge_awards.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- RLS Policies for rewards
CREATE POLICY "Organizers can manage rewards" ON public.rewards
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Public can view active rewards for published events" ON public.rewards
  FOR SELECT USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM events WHERE id = rewards.event_id AND status = 'published')
  );

-- RLS Policies for reward_claims
CREATE POLICY "Organizers can manage reward claims" ON public.reward_claims
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rewards r
      WHERE r.id = reward_claims.reward_id
      AND is_event_organizer(auth.uid(), r.event_id)
    )
  );

CREATE POLICY "Users can claim rewards" ON public.reward_claims
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = reward_claims.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

CREATE POLICY "Users can view own claims" ON public.reward_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = reward_claims.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- RLS Policies for engagement_scores
CREATE POLICY "Organizers can manage engagement scores" ON public.engagement_scores
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Users can view own engagement score" ON public.engagement_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = engagement_scores.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- RLS Policies for meeting_slots
CREATE POLICY "Organizers can manage meeting slots" ON public.meeting_slots
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Attendees can view available slots" ON public.meeting_slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE id = meeting_slots.event_id AND status = 'published')
  );

-- RLS Policies for meeting_requests
CREATE POLICY "Organizers can manage meeting requests" ON public.meeting_requests
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Users can manage own meeting requests" ON public.meeting_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE (r.id = meeting_requests.requester_id OR r.id = meeting_requests.target_id)
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- RLS Policies for content_library
CREATE POLICY "Organizers can manage content" ON public.content_library
  FOR ALL USING (is_event_organizer(auth.uid(), event_id));

CREATE POLICY "Public can view ungated content for published events" ON public.content_library
  FOR SELECT USING (
    is_gated = false AND
    EXISTS (SELECT 1 FROM events WHERE id = content_library.event_id AND status = 'published')
  );

CREATE POLICY "Registered users can view gated content" ON public.content_library
  FOR SELECT USING (
    is_gated = true AND
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.event_id = content_library.event_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
      AND r.status IN ('confirmed', 'checked_in')
    )
  );

-- RLS Policies for content_views
CREATE POLICY "Organizers can view all content views" ON public.content_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_library c
      WHERE c.id = content_views.content_id
      AND is_event_organizer(auth.uid(), c.event_id)
    )
  );

CREATE POLICY "Users can track own content views" ON public.content_views
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = content_views.registration_id
      AND (r.user_id = auth.uid() OR r.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
    )
  );

-- Add indexes for performance
CREATE INDEX idx_points_log_event ON public.points_log(event_id);
CREATE INDEX idx_points_log_registration ON public.points_log(registration_id);
CREATE INDEX idx_badges_event ON public.badges(event_id);
CREATE INDEX idx_badge_awards_registration ON public.badge_awards(registration_id);
CREATE INDEX idx_rewards_event ON public.rewards(event_id);
CREATE INDEX idx_reward_claims_registration ON public.reward_claims(registration_id);
CREATE INDEX idx_engagement_scores_event ON public.engagement_scores(event_id);
CREATE INDEX idx_meeting_slots_event ON public.meeting_slots(event_id);
CREATE INDEX idx_meeting_requests_event ON public.meeting_requests(event_id);
CREATE INDEX idx_content_library_event ON public.content_library(event_id);
CREATE INDEX idx_content_views_content ON public.content_views(content_id);

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.points_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.badge_awards;