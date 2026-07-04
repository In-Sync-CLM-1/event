-- Event categories (offline formats) + the reminder loop (WhatsApp + AI calls)

-- 1. Event type: conference / trade fair / roadshow / workshop / meetup / product launch / webinar
alter table public.events add column if not exists event_type text;

-- 2. Per-event reminder configuration
create table if not exists public.event_reminder_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  whatsapp_enabled boolean not null default true,
  calls_enabled boolean not null default false,
  remind_day_before boolean not null default true,
  remind_event_morning boolean not null default true,
  call_script text,
  bolna_agent_id text,
  updated_at timestamptz not null default now()
);

-- 3. Reminder log — one row per attendee per channel per wave
create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','ai_call')),
  kind text not null check (kind in ('day_before','event_morning','manual')),
  status text not null default 'queued',
  outcome text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_reminders_event on public.event_reminders(event_id, created_at desc);
create index if not exists idx_event_reminders_exec on public.event_reminders((detail->>'execution_id'));
-- One automated reminder per attendee/channel/wave (manual re-sends are allowed)
create unique index if not exists idx_event_reminders_dedup
  on public.event_reminders(event_id, registration_id, channel, kind)
  where kind <> 'manual';

alter table public.event_reminder_settings enable row level security;
alter table public.event_reminders enable row level security;

create policy "Organizers manage reminder settings" on public.event_reminder_settings
  for all to authenticated
  using (is_event_organizer(auth.uid(), event_id))
  with check (is_event_organizer(auth.uid(), event_id));

create policy "Organizers view reminders" on public.event_reminders
  for select to authenticated
  using (is_event_organizer(auth.uid(), event_id));
