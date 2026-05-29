// Submits all Event-Sync WhatsApp templates to Meta via Exotel.
// Call this once (or after adding new templates) — Meta approval takes 24-48 hrs.
//
// Template inventory (13 total):
//
//  ATTENDEE
//  ├── eventsync_registration    registration confirmation + QR code info
//  ├── eventsync_reminder        event reminder (24 h / 1 h)
//  ├── eventsync_checkin         check-in success
//  ├── eventsync_payment_receipt payment confirmed
//  ├── eventsync_waitlist_added  placed on waitlist
//  ├── eventsync_waitlist_promoted  waitlist → confirmed
//  ├── eventsync_certificate     certificate issued
//  ├── eventsync_badge_earned    gamification badge unlock
//  ├── eventsync_points_milestone gamification points milestone
//  ├── eventsync_event_cancelled event cancelled notice
//  └── eventsync_schedule_change session time/venue updated
//
//  ORGANISER
//  ├── eventsync_new_registration new registration alert
//  ├── eventsync_low_balance      wallet low balance warning
//  └── eventsync_topup_confirmed  wallet recharge confirmed

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://event-sync.in-sync.co.in";

const TEMPLATES = [

  // ── ATTENDEE ─────────────────────────────────────────────────────────────

  {
    name: "eventsync_registration",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYour registration for *{{2}}* is confirmed! 🎉\n\nDate: {{3}}\nVenue: {{4}}\nReg #: {{5}}\n\nShow your QR code at the gate for instant check-in.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "Sat, 20 Jun 2026, 09:00 AM", "HICC, Hyderabad", "EVT-0001-REG"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Registration",
            url: `${BASE_URL}/events/{{1}}`,
            example: ["tech-summit-2026"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_reminder",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nReminder: *{{2}}* is coming up! ⏰\n\nDate: {{3}}\nVenue: {{4}}\nYour Reg #: {{5}}\n\nBring your QR code for quick check-in. See you there!\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "Sat, 20 Jun 2026, 09:00 AM", "HICC, Hyderabad", "EVT-0001-REG"]],
        },
      },
    ],
  },

  {
    name: "eventsync_checkin",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYou're checked in to *{{2}}*! ✅\n\nTime: {{3}}\n\nEnjoy the event! Head to the schedule to plan your sessions.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "20 Jun 2026, 09:14 AM"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Schedule",
            url: `${BASE_URL}/events/{{1}}/my-schedule`,
            example: ["tech-summit-2026"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_payment_receipt",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nPayment received! ✅\n\nEvent: *{{2}}*\nAmount: ₹{{3}}\nReg #: {{4}}\nTransaction ID: {{5}}\n\nKeep this as your receipt.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "999", "EVT-0001-REG", "pay_QxR9sT1uVwXy"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Registration",
            url: `${BASE_URL}/events/{{1}}`,
            example: ["tech-summit-2026"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_waitlist_added",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYou've been added to the waitlist for *{{2}}*.\n\nWaitlist position: #{{3}}\n\nWe'll notify you immediately if a spot opens up.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "7"]],
        },
      },
    ],
  },

  {
    name: "eventsync_waitlist_promoted",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nGreat news! 🎉 A spot opened up — your registration for *{{2}}* is now *confirmed*.\n\nDate: {{3}}\nVenue: {{4}}\nReg #: {{5}}\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "Sat, 20 Jun 2026, 09:00 AM", "HICC, Hyderabad", "EVT-0001-REG"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Registration",
            url: `${BASE_URL}/events/{{1}}`,
            example: ["tech-summit-2026"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_certificate",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nCongratulations! 🏆 Your certificate of participation for *{{2}}* is ready.\n\nCertificate #: {{3}}\n\nVerify and share your certificate below.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "CERT-20260620-0001"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Certificate",
            url: `${BASE_URL}/verify/{{1}}`,
            example: ["CERT-20260620-0001"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_badge_earned",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYou just unlocked a new badge! 🥇\n\n*{{2}}*\nAt: {{3}}\n\n{{4}}\n\nKeep engaging to earn more!\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Networking Pro", "Tech Summit 2026", "Awarded for connecting with 10+ attendees."]],
        },
      },
    ],
  },

  {
    name: "eventsync_points_milestone",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYou've reached *{{2}} points* at {{3}}! 🏆\n\nLatest activity: {{4}}\n\nCheck the leaderboard to see your rank.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "500", "Tech Summit 2026", "Attended keynote session (+50 pts)"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Leaderboard",
            url: `${BASE_URL}/events/{{1}}/leaderboard`,
            example: ["evt-uuid-placeholder"],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_event_cancelled",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nWe regret to inform you that *{{2}}* scheduled for {{3}} has been *cancelled*.\n\n{{4}}\n\nRefunds (if applicable) will be processed within 5-7 business days. We apologise for the inconvenience.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "Sat, 20 Jun 2026", "Due to unforeseen circumstances, the event cannot proceed as planned."]],
        },
      },
    ],
  },

  {
    name: "eventsync_schedule_change",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nSchedule update for *{{2}}* ⚠️\n\nSession: {{3}}\nNew time: {{4}}\nNew venue: {{5}}\n\nWe apologise for any inconvenience.\n\n— Event-Sync",
        example: {
          body_text: [["Priya Sharma", "Tech Summit 2026", "AI in Healthcare — Panel", "20 Jun 2026, 03:00 PM", "Hall B (changed from Hall A)"]],
        },
      },
    ],
  },

  // ── ORGANISER ────────────────────────────────────────────────────────────

  {
    name: "eventsync_new_registration",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "New registration 📋\n\nEvent: *{{1}}*\nAttendee: {{2}}\nEmail: {{3}}\nTotal registrations: {{4}}\n\n— Event-Sync",
        example: {
          body_text: [["Tech Summit 2026", "Priya Sharma", "priya@example.com", "142"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "View Registrations",
            url: `${BASE_URL}/admin/registrations`,
            example: [""],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_low_balance",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "⚠️ Low wallet balance\n\nYour Event-Sync wallet balance is ₹{{1}}.\n\nRecharge now to avoid service interruptions for your upcoming events.\n\n— Event-Sync",
        example: {
          body_text: [["249"]],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            text: "Recharge Wallet",
            url: `${BASE_URL}/admin/billing`,
            example: [""],
          },
        ],
      },
    ],
  },

  {
    name: "eventsync_topup_confirmed",
    category: "UTILITY",
    language: "en",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}},\n\nWallet recharged! ✅\n\nAmount added: ₹{{2}}\nNew balance: ₹{{3}}\nTransaction ID: {{4}}\n\nYou're all set to run your events.\n\n— Event-Sync",
        example: {
          body_text: [["Ravi Kumar", "2000", "2499", "pay_QxR9sT1uVwXy"]],
        },
      },
    ],
  },

];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey     = Deno.env.get("EXOTEL_API_KEY");
    const apiToken   = Deno.env.get("EXOTEL_API_TOKEN");
    const accountSid = Deno.env.get("EXOTEL_ACCOUNT_SID");
    const wabaId     = Deno.env.get("EXOTEL_WABA_ID");
    const subdomain  = Deno.env.get("EXOTEL_SUBDOMAIN") || "api.exotel.com";

    if (!apiKey || !apiToken || !accountSid || !wabaId) {
      return new Response(
        JSON.stringify({ error: "Missing: EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID, EXOTEL_WABA_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `https://${apiKey}:${apiToken}@${subdomain}/v2/accounts/${accountSid}/templates?waba_id=${wabaId}`;
    const results = [];

    for (const template of TEMPLATES) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: { templates: [{ template }] } }),
      });

      const text = await res.text();
      let result;
      try { result = JSON.parse(text); } catch { result = { raw: text }; }

      console.log(`${template.name}:`, JSON.stringify(result));

      const templateRes = result?.response?.whatsapp?.templates?.[0];
      const errorMsg =
        templateRes?.data?.error?.error_user_msg ||
        templateRes?.data?.error?.message ||
        (!res.ok ? `HTTP ${res.status}` : null);

      results.push({
        template: template.name,
        success: res.ok && templateRes?.code === 200,
        status: templateRes?.data?.status || (res.ok ? "PENDING" : "ERROR"),
        error: errorMsg || null,
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ submitted: TEMPLATES.length, succeeded, failed, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("submit-whatsapp-templates error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
