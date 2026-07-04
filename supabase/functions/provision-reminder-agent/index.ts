// Creates (or updates) the Bolna voice agent that makes event reminder calls,
// and stores its id on event_reminder_settings. Port of the RMPL event-reminder
// method with the fleet's proven audio tuning (buffer 250, endpointing 200,
// incremental_delay 400, no synthesizer sample-rate override, caching off).
//
// POST body: { event_id }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BOLNA_BASE = "https://api.bolna.ai";
const RIYA_VOICE_ID = "vYENaCJHl4vFKNDYPr8y";

const SYSTEM_PROMPT = `You are Riya, Eventsync's automated event assistant. This is a courtesy reminder call about an event the person is registered for.

=== Mandatory disclosure ===
Early in the call, make clear you are an automated assistant calling on behalf of the event team.

=== Goal ===
Confirm whether {first_name} will be attending {event_name} on {event_date} at {event_venue}, {event_city}.

=== Speaking style (CRITICAL — the synthesizer reads your text literally) ===
Speak in very short sentences. Maximum one to two sentences per turn before pausing.
Never deliver a monologue. Wait for the user to respond.
Use full stops, not em-dashes, to create breath pauses.
Keep the entire call under two minutes.

=== Conversation flow ===
1. Greet, identify yourself as Eventsync's automated assistant, check if they have a moment.
2. Remind them of the event: name, date, venue, city.
3. Ask if they will be attending.
4. If yes — thank them, mention their entry QR code is on WhatsApp, and close.
5. If unsure — offer to keep their registration active and close politely.
6. If no — thank them and close warmly.

=== Boundaries ===
Do not invent details not provided in this prompt or the user data.
If asked something you cannot answer, say the event team will follow up on WhatsApp.`;

const WELCOME = "Hi, this is Riya, Eventsync's automated assistant. I'm calling with a quick reminder about {event_name} on {event_date}. Do you have a moment?";

const DISPOSITIONS = [
  { name: "disposition", question: "Which one best describes the response: Attending, Not Attending, Unsure, Callback Requested, or Wrong Number?" },
  { name: "attending", question: "Did the person clearly confirm they will attend? Respond true or false.", answer_format: "boolean" },
  { name: "notes", question: "One-sentence summary of the person's response, in plain English." },
];

function buildAgentBody(webhookUrl: string, eventTitle: string) {
  return {
    agent_config: {
      agent_name: `eventsync_reminder_${eventTitle.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, "_")}`,
      agent_welcome_message: WELCOME,
      webhook_url: webhookUrl,
      tasks: [{
        task_type: "conversation",
        toolchain: { execution: "parallel", pipelines: [["transcriber", "llm", "synthesizer"]] },
        tools_config: {
          input: { provider: "exotel", format: "wav", samples_per_second: 8000 },
          output: { provider: "exotel", format: "wav", samples_per_second: 8000 },
          llm_agent: {
            agent_type: "simple_llm_agent",
            agent_flow_type: "streaming",
            llm_config: { family: "openai", model: "gpt-4o-mini", temperature: 0.4, max_tokens: 150 },
          },
          transcriber: {
            provider: "deepgram", model: "nova-2", language: "en",
            stream: true, encoding: "linear16", endpointing: 200,
          },
          synthesizer: {
            provider: "elevenlabs", stream: true, buffer_size: 250, caching: false,
            provider_config: { voice: "Riya", voice_id: RIYA_VOICE_ID, model: "eleven_turbo_v2_5", language: "en" },
          },
        },
        task_config: {
          hangup_after_silence: 10,
          call_terminate: 180,
          backchanneling: false,
          check_if_user_online: false,
          incremental_delay: 400,
        },
      }],
    },
    agent_prompts: { task_1: { system_prompt: SYSTEM_PROMPT } },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const bolnaKey = Deno.env.get("BOLNA_API_KEY");
    if (!bolnaKey) return json({ success: false, error: "BOLNA_API_KEY not configured" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // organizer auth
    const caller = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    const isService = (req.headers.get("Authorization") || "").replace("Bearer ", "") === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!user && !isService) return json({ error: "Unauthorized" }, 401);

    const { event_id } = await req.json();
    if (!event_id) return json({ error: "event_id required" }, 400);
    const { data: event } = await sb.from("events").select("id, title").eq("id", event_id).single();
    if (!event) return json({ error: "event not found" }, 404);
    if (user) {
      const { data: ok } = await sb.rpc("is_event_organizer", { _user_id: user.id, _event_id: event.id });
      if (!ok) return json({ error: "Not an organizer of this event" }, 403);
    }

    const { data: settings } = await sb.from("event_reminder_settings")
      .select("bolna_agent_id").eq("event_id", event_id).maybeSingle();

    const bodyPayload = buildAgentBody(`${supabaseUrl}/functions/v1/bolna-event-webhook`, event.title);
    const headers = { Authorization: `Bearer ${bolnaKey}`, "Content-Type": "application/json" };

    let agentId = settings?.bolna_agent_id || null;
    if (agentId) {
      const res = await fetch(`${BOLNA_BASE}/v2/agent/${agentId}`, { method: "PATCH", headers, body: JSON.stringify(bodyPayload) });
      if (res.status === 404) agentId = null;
      else if (!res.ok) return json({ success: false, error: `Bolna PATCH ${res.status}: ${await res.text()}` });
    }
    if (!agentId) {
      const res = await fetch(`${BOLNA_BASE}/v2/agent`, { method: "POST", headers, body: JSON.stringify(bodyPayload) });
      const rbody = await res.json().catch(() => ({}));
      if (!res.ok) return json({ success: false, error: `Bolna POST ${res.status}: ${JSON.stringify(rbody).slice(0, 400)}` });
      agentId = rbody?.agent_id || rbody?.id;
      if (!agentId) return json({ success: false, error: "Bolna response missing agent_id" });
    }

    // re-sync disposition questions (wipe + recreate, best effort)
    const listRes = await fetch(`${BOLNA_BASE}/dispositions/?agent_id=${agentId}`, { headers: { Authorization: `Bearer ${bolnaKey}` } });
    if (listRes.ok) {
      const existing = await listRes.json().catch(() => []);
      const rows = Array.isArray(existing) ? existing : (existing?.dispositions || existing?.data || []);
      for (const row of rows) {
        if (row?.id) await fetch(`${BOLNA_BASE}/dispositions/${row.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${bolnaKey}` } }).catch(() => {});
      }
    }
    for (const q of DISPOSITIONS) {
      await fetch(`${BOLNA_BASE}/dispositions/`, { method: "POST", headers, body: JSON.stringify({ agent_id: agentId, ...q }) }).catch(() => {});
    }

    await sb.from("event_reminder_settings").upsert({
      event_id, bolna_agent_id: agentId, updated_at: new Date().toISOString(),
    }, { onConflict: "event_id" });

    return json({ success: true, agent_id: agentId });
  } catch (e: any) {
    return json({ success: false, error: e?.message || String(e) });
  }
});
