import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://event-sync.in-sync.co.in";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function err(msg: string, status = 400) { return json({ error: msg }, status); }

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function phone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  return p;
}

// ── Exotel sender ─────────────────────────────────────────────────────────────

async function sendWA(to: string, content: object) {
  const apiKey     = Deno.env.get("EXOTEL_API_KEY")!;
  const apiToken   = Deno.env.get("EXOTEL_API_TOKEN")!;
  const accountSid = Deno.env.get("EXOTEL_ACCOUNT_SID")!;
  const fromNumber = Deno.env.get("EXOTEL_WHATSAPP_NUMBER")!;
  const subdomain  = Deno.env.get("EXOTEL_SUBDOMAIN") || "api.exotel.com";

  const res = await fetch(`https://${subdomain}/v2/accounts/${accountSid}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${apiToken}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      whatsapp: { messages: [{ from: fromNumber, to: phone(to), content }] },
    }),
  });
  return res.json();
}

function tpl(name: string, bodyParams: string[], buttonSuffix?: string) {
  const components: object[] = [
    { type: "body", parameters: bodyParams.map(t => ({ type: "text", text: t })) },
  ];
  if (buttonSuffix !== undefined) {
    components.push({
      type: "button", sub_type: "url", index: "0",
      parameters: [{ type: "text", text: buttonSuffix }],
    });
  }
  return { type: "template", template: { name, language: { code: "en" }, components } };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing authorization", 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await caller.auth.getUser();
  if (authErr || !user) return err("Unauthorized", 401);

  const { type, ...p } = await req.json();

  // ── registration_confirmation ─────────────────────────────────────────────
  if (type === "registration_confirmation") {
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, registration_number, events(title,start_date,venue,slug)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_registration",
      [reg.full_name, ev.title, fmt(ev.start_date), ev.venue || "TBD", reg.registration_number], ev.slug));
    return json({ success: true, result });
  }

  // ── event_reminder ────────────────────────────────────────────────────────
  if (type === "event_reminder") {
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, registration_number, events(title,start_date,venue)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_reminder",
      [reg.full_name, ev.title, fmt(ev.start_date), ev.venue || "TBD", reg.registration_number]));
    return json({ success: true, result });
  }

  // ── checkin_confirmation ──────────────────────────────────────────────────
  if (type === "checkin_confirmation") {
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, checked_in_at, events(title,slug)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const checkInTime = fmt(reg.checked_in_at || new Date().toISOString());
    const result = await sendWA(reg.phone, tpl("eventsync_checkin",
      [reg.full_name, ev.title, checkInTime], `${ev.slug}/my-schedule`));
    return json({ success: true, result });
  }

  // ── payment_receipt ───────────────────────────────────────────────────────
  if (type === "payment_receipt") {
    // p: { registration_id, amount, transaction_id }
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, registration_number, events(title,slug)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_payment_receipt",
      [reg.full_name, ev.title, String(p.amount), reg.registration_number, p.transaction_id], ev.slug));
    return json({ success: true, result });
  }

  // ── waitlist_added ────────────────────────────────────────────────────────
  if (type === "waitlist_added") {
    // p: { registration_id, position }
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, events(title)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_waitlist_added",
      [reg.full_name, ev.title, String(p.position || "—")]));
    return json({ success: true, result });
  }

  // ── waitlist_promoted ─────────────────────────────────────────────────────
  if (type === "waitlist_promoted") {
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, registration_number, events(title,start_date,venue,slug)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_waitlist_promoted",
      [reg.full_name, ev.title, fmt(ev.start_date), ev.venue || "TBD", reg.registration_number], ev.slug));
    return json({ success: true, result });
  }

  // ── certificate_issued ────────────────────────────────────────────────────
  if (type === "certificate_issued") {
    const { data: cert } = await sb
      .from("certificates")
      .select("certificate_number, registrations(full_name,phone), events(title)")
      .eq("id", p.certificate_id).single();
    if (!cert) return err("Not found");
    const reg: any  = Array.isArray(cert.registrations) ? cert.registrations[0] : cert.registrations;
    const ev: any   = Array.isArray(cert.events)        ? cert.events[0]        : cert.events;
    if (!reg.phone) return json({ skipped: "no phone" });
    const result = await sendWA(reg.phone, tpl("eventsync_certificate",
      [reg.full_name, ev.title, cert.certificate_number], cert.certificate_number));
    return json({ success: true, result });
  }

  // ── badge_earned ──────────────────────────────────────────────────────────
  if (type === "badge_earned") {
    // p: { badge_award_id }
    const { data: award } = await sb
      .from("badge_awards")
      .select("badges(name,description,events(title)), registrations(full_name,phone)")
      .eq("id", p.badge_award_id).single();
    if (!award) return err("Not found");
    const reg: any   = Array.isArray(award.registrations) ? award.registrations[0] : award.registrations;
    const badge: any = Array.isArray(award.badges)        ? award.badges[0]        : award.badges;
    const ev: any    = Array.isArray(badge.events)        ? badge.events[0]        : badge.events;
    if (!reg.phone) return json({ skipped: "no phone" });
    const result = await sendWA(reg.phone, tpl("eventsync_badge_earned",
      [reg.full_name, badge.name, ev.title, badge.description || "Keep engaging to earn more badges!"]));
    return json({ success: true, result });
  }

  // ── points_milestone ──────────────────────────────────────────────────────
  if (type === "points_milestone") {
    // p: { registration_id, total_points, activity_description, event_id }
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, events(id,title)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_points_milestone",
      [reg.full_name, String(p.total_points), ev.title, p.activity_description || "Activity completed"],
      ev.id));
    return json({ success: true, result });
  }

  // ── event_cancelled ───────────────────────────────────────────────────────
  if (type === "event_cancelled") {
    // p: { registration_id, reason }
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, events(title,start_date)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_event_cancelled",
      [reg.full_name, ev.title, fmt(ev.start_date),
       p.reason || "Due to unforeseen circumstances the event cannot proceed as planned."]));
    return json({ success: true, result });
  }

  // ── schedule_change ───────────────────────────────────────────────────────
  if (type === "schedule_change") {
    // p: { registration_id, session_name, new_time, new_venue }
    const { data: reg } = await sb
      .from("registrations")
      .select("full_name, phone, events(title)")
      .eq("id", p.registration_id).single();
    if (!reg) return err("Not found");
    if (!reg.phone) return json({ skipped: "no phone" });
    const ev: any = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const result = await sendWA(reg.phone, tpl("eventsync_schedule_change",
      [reg.full_name, ev.title, p.session_name, p.new_time, p.new_venue]));
    return json({ success: true, result });
  }

  // ── new_registration (organiser) ──────────────────────────────────────────
  if (type === "new_registration_alert") {
    // p: { organiser_phone, event_title, attendee_name, attendee_email, total_count }
    const result = await sendWA(p.organiser_phone, tpl("eventsync_new_registration",
      [p.event_title, p.attendee_name, p.attendee_email, String(p.total_count)]));
    return json({ success: true, result });
  }

  // ── low_balance (organiser) ───────────────────────────────────────────────
  if (type === "low_balance_alert") {
    // p: { organiser_phone, balance }
    const result = await sendWA(p.organiser_phone, tpl("eventsync_low_balance",
      [String(p.balance)]));
    return json({ success: true, result });
  }

  // ── topup_confirmed (organiser) ───────────────────────────────────────────
  if (type === "topup_confirmed") {
    // p: { organiser_phone, organiser_name, amount, new_balance, transaction_id }
    const result = await sendWA(p.organiser_phone, tpl("eventsync_topup_confirmed",
      [p.organiser_name, String(p.amount), String(p.new_balance), p.transaction_id]));
    return json({ success: true, result });
  }

  // ── raw (admin only) ─────────────────────────────────────────────────────
  if (type === "raw") {
    const { data: roleRow } = await sb
      .from("user_roles").select("role").eq("user_id", user.id)
      .in("role", ["super_admin", "platform_admin"]).maybeSingle();
    if (!roleRow) return err("Admin access required", 403);
    if (!p.to || !p.content) return err("Missing to/content");
    const result = await sendWA(p.to, p.content);
    return json({ success: true, result });
  }

  return err(
    "Unknown type. Valid: registration_confirmation | event_reminder | checkin_confirmation | " +
    "payment_receipt | waitlist_added | waitlist_promoted | certificate_issued | " +
    "badge_earned | points_milestone | event_cancelled | schedule_change | " +
    "new_registration_alert | low_balance_alert | topup_confirmed | raw",
  );
});
