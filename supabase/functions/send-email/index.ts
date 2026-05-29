import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "Event-Sync <noreply@in-sync.co.in>";
const RESEND_URL = "https://api.resend.com/emails";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return res.json();
}

// ── Email templates ───────────────────────────────────────────────────────────

function baseLayout(content: string, previewText = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Event-Sync</title>
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#0891b2 100%);padding:32px 40px;text-align:center;">
            <span style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 20px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Event-Sync</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © ${new Date().getFullYear()} In-Sync · <a href="https://in-sync.co.in" style="color:#94a3b8;">in-sync.co.in</a>
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">You're receiving this because you registered for an event on Event-Sync.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function registrationConfirmationHtml(data: {
  full_name: string;
  event_title: string;
  event_date: string;
  event_venue: string;
  registration_number: string;
  qr_code: string;
  event_url: string;
}) {
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">You're registered! 🎉</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">Hi ${data.full_name}, your spot at <strong style="color:#1e40af;">${data.event_title}</strong> is confirmed.</p>

    <!-- Event details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;width:120px;">Date</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.event_date}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Venue</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.event_venue}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Reg #</td>
            <td style="padding:6px 0;color:#1e40af;font-size:14px;font-weight:700;font-family:monospace;">${data.registration_number}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <!-- QR code section -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff 0%,#f0fdfa 100%);border:1px solid #bfdbfe;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:.5px;">Your Check-In QR Code</p>
        <img src="${data.qr_code}" alt="QR Code" width="160" height="160"
          style="display:block;margin:0 auto 12px;border-radius:8px;border:4px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
        <p style="margin:0;font-size:12px;color:#64748b;">Show this at the gate for instant check-in. No app needed.</p>
      </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${data.event_url}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
        View Event Details →
      </a>
    </div>
  `, `You're registered for ${data.event_title}`);
}

function certificateIssuedHtml(data: {
  full_name: string;
  event_title: string;
  certificate_number: string;
  verify_url: string;
  issued_date: string;
}) {
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Your certificate is ready 🏆</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Congratulations, ${data.full_name}! Your certificate of participation for
      <strong style="color:#1e40af;">${data.event_title}</strong> has been issued.
    </p>

    <!-- Certificate card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#eff6ff 0%,#f0fdfa 100%);border:2px solid #bfdbfe;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:28px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🎓</div>
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Certificate of Participation</p>
        <p style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">${data.full_name}</p>
        <p style="margin:0 0 16px;font-size:14px;color:#475569;">${data.event_title} · ${data.issued_date}</p>
        <p style="margin:0;font-size:12px;color:#94a3b8;font-family:monospace;">Cert # ${data.certificate_number}</p>
      </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${data.verify_url}" style="display:inline-block;background:#0891b2;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
        View &amp; Share Certificate →
      </a>
    </div>
    <p style="margin:0;text-align:center;font-size:12px;color:#94a3b8;">
      Verifiable at: <a href="${data.verify_url}" style="color:#0891b2;">${data.verify_url}</a>
    </p>
  `, `Your certificate for ${data.event_title} is ready`);
}

function eventReminderHtml(data: {
  full_name: string;
  event_title: string;
  event_date: string;
  event_venue: string;
  registration_number: string;
  qr_code: string;
  event_url: string;
  hours_until: number;
}) {
  const timeLabel = data.hours_until <= 2
    ? `starts in ${data.hours_until} hour${data.hours_until !== 1 ? "s" : ""}`
    : data.hours_until <= 24
    ? "is tomorrow"
    : `is in ${Math.round(data.hours_until / 24)} days`;

  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">⏰ Reminder: Your event ${timeLabel}</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Hi ${data.full_name}, just a reminder that <strong style="color:#1e40af;">${data.event_title}</strong> ${timeLabel}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;width:120px;">Date</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.event_date}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Venue</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:500;">${data.event_venue}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Reg #</td>
            <td style="padding:6px 0;color:#1e40af;font-size:14px;font-weight:700;font-family:monospace;">${data.registration_number}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${data.qr_code ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px;text-align:center;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#166534;">Your Check-In QR Code</p>
        <img src="${data.qr_code}" alt="QR Code" width="120" height="120"
          style="display:block;margin:0 auto;border-radius:8px;border:3px solid #ffffff;" />
      </td></tr>
    </table>` : ""}

    <div style="text-align:center;">
      <a href="${data.event_url}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
        View Event Details →
      </a>
    </div>
  `, `Reminder: ${data.event_title} ${timeLabel}`);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authenticate — accept service role or user JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing authorization", 401);

  // Only allow internal service calls or platform admins to send emails
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await callerClient.auth.getUser();
  if (authErr || !user) return err("Unauthorized", 401);

  const { type, ...payload } = await req.json();

  // ── registration_confirmation ─────────────────────────────────────────────

  if (type === "registration_confirmation") {
    const { registration_id } = payload;

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select(`
        full_name, email, registration_number, qr_code,
        events ( title, start_date, venue, slug )
      `)
      .eq("id", registration_id)
      .single();

    if (regErr || !reg) return err("Registration not found");

    const event = Array.isArray(reg.events) ? reg.events[0] : reg.events as {
      title: string; start_date: string; venue: string; slug: string;
    };

    const eventDate = new Date(event.start_date).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const baseUrl = Deno.env.get("SITE_URL") || "https://event-sync.in-sync.co.in";

    const result = await sendEmail(
      reg.email,
      `You're registered for ${event.title}`,
      registrationConfirmationHtml({
        full_name:           reg.full_name,
        event_title:         event.title,
        event_date:          eventDate,
        event_venue:         event.venue || "TBD",
        registration_number: reg.registration_number,
        qr_code:             reg.qr_code || "",
        event_url:           `${baseUrl}/events/${event.slug}`,
      }),
    );

    if (result.error) return err(result.error.message || "Email send failed", 502);
    return json({ success: true, email_id: result.id });
  }

  // ── certificate_issued ────────────────────────────────────────────────────

  if (type === "certificate_issued") {
    const { certificate_id } = payload;

    const { data: cert, error: certErr } = await supabase
      .from("certificates")
      .select(`
        certificate_number, issued_at,
        registrations ( full_name, email ),
        events ( title )
      `)
      .eq("id", certificate_id)
      .single();

    if (certErr || !cert) return err("Certificate not found");

    const reg  = Array.isArray(cert.registrations) ? cert.registrations[0] : cert.registrations as { full_name: string; email: string };
    const event = Array.isArray(cert.events) ? cert.events[0] : cert.events as { title: string };
    const baseUrl = Deno.env.get("SITE_URL") || "https://event-sync.in-sync.co.in";

    const result = await sendEmail(
      reg.email,
      `Your certificate for ${event.title} is ready`,
      certificateIssuedHtml({
        full_name:          reg.full_name,
        event_title:        event.title,
        certificate_number: cert.certificate_number,
        verify_url:         `${baseUrl}/verify/${cert.certificate_number}`,
        issued_date:        new Date(cert.issued_at).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        }),
      }),
    );

    if (result.error) return err(result.error.message || "Email send failed", 502);
    return json({ success: true, email_id: result.id });
  }

  // ── event_reminder ────────────────────────────────────────────────────────

  if (type === "event_reminder") {
    const { registration_id, hours_until = 24 } = payload;

    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select(`
        full_name, email, registration_number, qr_code,
        events ( title, start_date, venue, slug )
      `)
      .eq("id", registration_id)
      .single();

    if (regErr || !reg) return err("Registration not found");

    const event = Array.isArray(reg.events) ? reg.events[0] : reg.events as {
      title: string; start_date: string; venue: string; slug: string;
    };

    const eventDate = new Date(event.start_date).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const baseUrl = Deno.env.get("SITE_URL") || "https://event-sync.in-sync.co.in";

    const result = await sendEmail(
      reg.email,
      `Reminder: ${event.title} is coming up`,
      eventReminderHtml({
        full_name:           reg.full_name,
        event_title:         event.title,
        event_date:          eventDate,
        event_venue:         event.venue || "TBD",
        registration_number: reg.registration_number,
        qr_code:             reg.qr_code || "",
        event_url:           `${baseUrl}/events/${event.slug}`,
        hours_until:         Number(hours_until),
      }),
    );

    if (result.error) return err(result.error.message || "Email send failed", 502);
    return json({ success: true, email_id: result.id });
  }

  // ── raw (direct send, admins only) ───────────────────────────────────────

  if (type === "raw") {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "platform_admin"])
      .maybeSingle();

    if (!roleRow) return err("Admin access required", 403);

    const { to, subject, html } = payload;
    if (!to || !subject || !html) return err("Missing to/subject/html");

    const result = await sendEmail(to, subject, html);
    if (result.error) return err(result.error.message || "Email send failed", 502);
    return json({ success: true, email_id: result.id });
  }

  return err("Unknown email type", 400);
});
