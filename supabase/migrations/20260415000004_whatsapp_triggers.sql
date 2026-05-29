-- WhatsApp notification triggers via Exotel
-- Fires send-whatsapp edge function on:
--   1. New registration confirmed → eventsync_registration template
--   2. Certificate issued         → eventsync_certificate template
-- Requires pg_net extension (enabled by default on Supabase)

-- ── Private schema for internal helpers ──────────────────────────────────────

create schema if not exists private;

-- ── Helper: call send-whatsapp edge function via pg_net ───────────────────────

create or replace function private.notify_whatsapp(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  project_url text := 'https://gwfofzqrfpwojejjodgz.supabase.co';
  service_key text;
begin
  -- Get service role key from vault / env
  select decrypted_secret into service_key
  from vault.decrypted_secrets
  where name = 'SUPABASE_SERVICE_ROLE_KEY'
  limit 1;

  -- Fallback: if vault not configured, skip silently
  if service_key is null or service_key = '' then
    raise warning 'notify_whatsapp: SUPABASE_SERVICE_ROLE_KEY not in vault — skipping';
    return;
  end if;

  perform net.http_post(
    url     := project_url || '/functions/v1/send-whatsapp',
    body    := payload::text,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );
exception when others then
  -- Never block the originating transaction
  raise warning 'notify_whatsapp failed: %', sqlerrm;
end;
$$;

-- ── Trigger 1: Registration confirmation ─────────────────────────────────────

create or replace function private.on_registration_send_whatsapp()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only fire for confirmed/paid registrations
  if NEW.status in ('confirmed', 'paid') then
    perform private.notify_whatsapp(
      jsonb_build_object(
        'type',            'registration_confirmation',
        'registration_id', NEW.id
      )
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_registration_whatsapp on public.registrations;
create trigger trg_registration_whatsapp
  after insert or update of status
  on public.registrations
  for each row
  execute function private.on_registration_send_whatsapp();

-- ── Trigger 2: Certificate issued ────────────────────────────────────────────

create or replace function private.on_certificate_send_whatsapp()
returns trigger
language plpgsql
security definer
as $$
begin
  perform private.notify_whatsapp(
    jsonb_build_object(
      'type',           'certificate_issued',
      'certificate_id', NEW.id
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_certificate_whatsapp on public.certificates;
create trigger trg_certificate_whatsapp
  after insert
  on public.certificates
  for each row
  execute function private.on_certificate_send_whatsapp();
