-- Virtual / Hybrid event support
-- Adds mode (in_person | virtual | hybrid) and virtual_join_url to events and sessions.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'in_person'
    CHECK (mode IN ('in_person', 'virtual', 'hybrid')),
  ADD COLUMN IF NOT EXISTS virtual_join_url TEXT;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS virtual_join_url TEXT;
