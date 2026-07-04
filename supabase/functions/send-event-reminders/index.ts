// Dispatches event reminders to confirmed attendees over two channels:
//   whatsapp — Exotel template `eventsync_reminder` (approved, 5 body params)
//   ai_call  — Bolna voice agent provisioned by provision-reminder-agent
//
// POST body:
//   { event_id?, kind: "day_before" | "event_morning" | "manual",
//     channels?: ["whatsapp","ai_call"], limit?, dry_run? }
//
// Without event_id it sweeps published events whose start_date falls in the
// kind's window (day_before → tomorrow IST, event_morning → today IST), so a
// Cloudflare cron worker can POST {"kind":"..."} on a schedule.
//
// Callable by an event organizer (user JWT) or the cron worker (service key).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BOLNA_BASE = "https://api.bolna.ai";

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
}
function fmtSpokenDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata",
  });
}
function waPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (p.length === 10) p = "91" + p;
  return p;
}
// E.164 for Bolna — fails closed (null) so we never ship a malformed number
function e164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return /^\+[1-9]\d{9,14}$/.test(raw.trim()) ? raw.trim() : null;
}
const firstName = (n: string | null) => (n || "there").trim().split(/\s+/)[0];

// IST calendar date string for "today + offsetDays"
function istDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  // ── auth: organizer JWT or the service key itself (cron worker) ────────────
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.replace("Bearer ", "");
  let callerId: string | null = null;
  const isService = bearer === serviceKey;
  if (!isService) {
    const caller = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    callerId = user.id;
  }

  const body = await req.json().catch(() => ({}));
  const kind: string = body.kind || "manual";
  if (!["day_before", "event_morning", "manual"].includes(kind)) return json({ error: "bad kind" }, 400);

  // ── resolve target events ──────────────────────────────────────────────────
  let events: any[] = [];
  if (body.event_id) {
    const { data } = await sb.from("events").select("*").eq("id", body.event_id).single();
    if (!data) return json({ error: "event not found" }, 404);
    if (callerId) {
      const { data: ok } = await sb.rpc("is_event_organizer", { _user_id: callerId, _event_id: data.id });
      if (!ok) return json({ error: "Not an organizer of this event" }, 403);
    }
    events = [data];
  } else {
    if (!isService) return json({ error: "event_id required" }, 400);
    const target = kind === "day_before" ? istDate(1) : istDate(0);
    const { data } = await sb.from("events").select("*").eq("status", "published");
    events = (data || []).filter((e) =>
      new Date(e.start_date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === target,
    );
  }

  const results: any[] = [];
  for (const event of events) {
    // settings (defaults if unset: WhatsApp on, calls off)
    const { data: settings } = await sb.from("event_reminder_settings")
      .select("*").eq("event_id", event.id).maybeSingle();
    const s = settings || { whatsapp_enabled: true, calls_enabled: false, remind_day_before: true, remind_event_morning: true, bolna_agent_id: null };
    if (kind === "day_before" && !s.remind_day_before) continue;
    if (kind === "event_morning" && !s.remind_event_morning) continue;

    const channels: string[] = body.channels ||
      [...(s.whatsapp_enabled ? ["whatsapp"] : []), ...(s.calls_enabled ? ["ai_call"] : [])];

    // confirmed attendees with a phone
    const { data: regs } = await sb.from("registrations")
      .select("id, full_name, phone, registration_number, status")
      .eq("event_id", event.id)
      .in("status", ["confirmed", "checked_in"])
      .not("phone", "is", null);
    const attendees = (regs || []).filter((r) => r.status !== "checked_in" || kind === "manual");

    // dedup against prior waves
    const { data: prior } = await sb.from("event_reminders")
      .select("registration_id, channel").eq("event_id", event.id).eq("kind", kind);
    const done = new Set((prior || []).map((p) => `${p.registration_id}:${p.channel}`));

    const summary: Record<string, number> = { whatsapp: 0, ai_call: 0, skipped: 0, failed: 0 };

    // ── WhatsApp wave ─────────────────────────────────────────────────────────
    if (channels.includes("whatsapp")) {
      const waLimit = Number(body.limit ?? 500);
      const apiKey = Deno.env.get("EXOTEL_API_KEY")!;
      const apiToken = Deno.env.get("EXOTEL_API_TOKEN")!;
      const sid = Deno.env.get("EXOTEL_ACCOUNT_SID")!;
      const from = Deno.env.get("EXOTEL_WHATSAPP_NUMBER")!;
      const subdomain = Deno.env.get("EXOTEL_SUBDOMAIN") || "api.exotel.com";
      let sent = 0;
      for (const r of attendees) {
        if (sent >= waLimit) break;
        if (done.has(`${r.id}:whatsapp`)) { summary.skipped++; continue; }
        if (body.dry_run) { summary.whatsapp++; sent++; continue; }
        const content = {
          type: "template",
          template: {
            name: "eventsync_reminder",
            language: { code: "en" },
            components: [{
              type: "body",
              parameters: [r.full_name, event.title, fmtDate(event.start_date),
                `${event.venue || "TBD"}${event.city ? ", " + event.city : ""}`, r.registration_number]
                .map((t) => ({ type: "text", text: String(t) })),
            }],
          },
        };
        const res = await fetch(`https://${subdomain}/v2/accounts/${sid}/messages`, {
          method: "POST",
          headers: { Authorization: `Basic ${btoa(`${apiKey}:${apiToken}`)}`, "Content-Type": "application/json" },
          body: JSON.stringify({ whatsapp: { messages: [{ from, to: waPhone(r.phone), content }] } }),
        });
        const rbody = await res.json().catch(() => ({}));
        const ok = res.status === 202;
        await sb.from("event_reminders").upsert({
          event_id: event.id, registration_id: r.id, channel: "whatsapp", kind,
          status: ok ? "sent" : "failed",
          detail: { http: res.status, sid: rbody?.response?.whatsapp?.messages?.[0]?.data?.sid || null },
        }, { onConflict: "event_id,registration_id,channel,kind", ignoreDuplicates: true });
        ok ? summary.whatsapp++ : summary.failed++;
        sent++;
      }
    }

    // ── AI call wave ──────────────────────────────────────────────────────────
    if (channels.includes("ai_call")) {
      if (!s.bolna_agent_id) {
        results.push({ event: event.title, error: "ai_call requested but no reminder agent provisioned" });
      } else {
        const callLimit = Number(body.limit ?? 50);
        const bolnaKey = Deno.env.get("BOLNA_API_KEY")!;
        const fromNumber = Deno.env.get("BOLNA_FROM_NUMBER")!;
        let calls = 0;
        for (const r of attendees) {
          if (calls >= callLimit) break;
          if (done.has(`${r.id}:ai_call`)) { summary.skipped++; continue; }
          const to = e164(r.phone);
          if (!to) { summary.skipped++; continue; }
          if (body.dry_run) { summary.ai_call++; calls++; continue; }
          const res = await fetch(`${BOLNA_BASE}/call`, {
            method: "POST",
            headers: { Authorization: `Bearer ${bolnaKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              agent_id: s.bolna_agent_id,
              recipient_phone_number: to,
              from_phone_number: fromNumber,
              user_data: {
                first_name: firstName(r.full_name),
                event_name: event.title,
                event_date: fmtSpokenDate(event.start_date),
                event_venue: event.venue || "",
                event_city: event.city || "",
              },
            }),
          });
          const rbody = await res.json().catch(() => ({}));
          const execId = rbody?.execution_id || rbody?.id || null;
          await sb.from("event_reminders").upsert({
            event_id: event.id, registration_id: r.id, channel: "ai_call", kind,
            status: res.ok ? (rbody?.status || "queued") : "failed",
            detail: { execution_id: execId, http: res.status },
          }, { onConflict: "event_id,registration_id,channel,kind", ignoreDuplicates: true });
          res.ok ? summary.ai_call++ : summary.failed++;
          calls++;
        }
      }
    }

    results.push({ event: event.title, kind, ...summary });
  }

  return json({ success: true, results });
});
