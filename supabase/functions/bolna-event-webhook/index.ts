// Bolna post-call webhook for event reminder calls.
// Public endpoint (verify_jwt = false) — Bolna cannot send Supabase JWTs.
// Matches the reminder row by execution_id and writes status + outcome.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ok = () => new Response(JSON.stringify({ received: true }), {
  status: 200, headers: { "Content-Type": "application/json" },
});

function mapStatus(s: string | undefined): string {
  const v = (s || "").toLowerCase();
  if (["completed", "call-disconnected", "ended"].includes(v)) return "completed";
  if (["busy", "no-answer", "noanswer"].includes(v)) return "no_answer";
  if (["failed", "error", "cancelled"].includes(v)) return "failed";
  return v || "completed";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return ok();
  try {
    const payload = await req.json();
    const execId = payload?.id || payload?.execution_id || payload?.data?.execution_id;
    if (!execId) return ok();

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row } = await sb.from("event_reminders")
      .select("id, detail")
      .eq("channel", "ai_call")
      .filter("detail->>execution_id", "eq", String(execId))
      .maybeSingle();
    if (!row) return ok();

    const extracted = payload?.extracted_data || payload?.context_details?.extracted_data || {};
    const attending = extracted?.attending;
    const outcome =
      attending === true || String(attending).toLowerCase() === "true"
        ? "Confirmed — will attend"
        : extracted?.disposition || extracted?.notes || null;

    await sb.from("event_reminders").update({
      status: mapStatus(payload?.status),
      outcome,
      detail: {
        ...row.detail,
        conversation_duration: payload?.conversation_duration ?? null,
        disposition: extracted?.disposition ?? null,
        notes: extracted?.notes ?? null,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
  } catch (e) {
    console.error("bolna-event-webhook error:", e);
  }
  return ok();
});
