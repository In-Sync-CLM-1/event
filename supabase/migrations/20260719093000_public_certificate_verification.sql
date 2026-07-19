-- Public certificate verification.
-- The /verify/<number> page is a logged-out surface, but RLS on certificates
-- only allows organizers and the certificate's own attendee to read rows, so
-- every public verification failed with "Certificate Not Found".
-- A SECURITY DEFINER lookup keyed on the exact certificate number returns the
-- single certificate plus the display fields the page needs, without granting
-- anon any table-level read on certificates or registrations.

create or replace function public.verify_certificate(cert_number text)
returns table (
  certificate_number text,
  issued_at timestamptz,
  pdf_url text,
  attendee_name text,
  attendee_email text,
  event_title text,
  event_start_date timestamptz,
  event_end_date timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.issued_at,
    c.pdf_url,
    r.full_name,
    r.email,
    e.title,
    e.start_date,
    e.end_date
  from certificates c
  join registrations r on r.id = c.registration_id
  join events e on e.id = c.event_id
  where c.certificate_number = cert_number;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
