// Eventsync external scheduler — ONE worker per job (fleet standard: no pg_cron).
// Each deployed worker sets TARGET_FN (+ optional BODY) and POSTs to that one
// edge function on its cron, authing with the service-role key (Worker secret)
// so it passes verify_jwt.
const FN_BASE = "https://gwfofzqrfpwojejjodgz.supabase.co/functions/v1";

async function tick(env) {
  if (!env.TARGET_FN) return new Response("no TARGET_FN configured\n", { status: 500 });
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${FN_BASE}/${env.TARGET_FN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: env.BODY || "{}",
  }).catch((e) => new Response(String(e), { status: 502 }));
  return new Response(`${env.TARGET_FN}: ${res.status}\n`);
}

export default {
  async scheduled(_event, env, _ctx) { await tick(env); },
  // Manual kick / health check.
  async fetch(_req, env) { return tick(env); },
};
