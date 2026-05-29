import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

async function razorpayRequest(path: string, method: string, body?: unknown) {
  const keyId     = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const auth = btoa(`${keyId}:${keySecret}`);

  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const message = `${orderId}|${paymentId}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Authenticate caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing authorization", 401);

  const { data: { user }, error: authErr } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  ).auth.getUser();

  if (authErr || !user) return err("Unauthorized", 401);

  const { action, ...payload } = await req.json();

  // ── create_order ────────────────────────────────────────────────────────────

  if (action === "create_order") {
    const amount = Number(payload.amount);
    if (!amount || amount < 500) return err("Minimum recharge amount is ₹500");

    // Verify caller has an admin role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "event_manager"])
      .maybeSingle();

    if (!roleRow) return err("Only admins can add funds", 403);

    const order = await razorpayRequest("/orders", "POST", {
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `eventsync_${user.id.slice(0, 8)}_${Date.now()}`,
    });

    if (order.error) return err(order.error.description || "Failed to create order", 502);

    return json({
      order_id:   order.id,
      amount:     order.amount,
      currency:   order.currency,
      razorpay_key_id: Deno.env.get("RAZORPAY_KEY_ID"),
    });
  }

  // ── verify_payment ──────────────────────────────────────────────────────────

  if (action === "verify_payment") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return err("Missing payment fields");
    }

    const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return err("Payment signature verification failed", 400);

    // Credit wallet
    const { data: newBalance, error: creditErr } = await supabase.rpc("credit_wallet", {
      _user_id:      user.id,
      _amount:       Number(amount) / 100, // convert paise → rupees
      _category:     "topup",
      _description:  `Wallet recharge via Razorpay`,
      _reference_id: razorpay_payment_id,
    });

    if (creditErr) return err("Failed to credit wallet: " + creditErr.message, 500);

    return json({ success: true, new_balance: newBalance, payment_id: razorpay_payment_id });
  }

  // ── get_balance ─────────────────────────────────────────────────────────────

  if (action === "get_balance") {
    const { data, error } = await supabase
      .from("billing_accounts")
      .select("balance, total_credited, total_debited, plan, trial_events_used, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return err(error.message, 500);

    // Count users on this account (organiser + staff roles)
    const { count: userCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .in("role", ["super_admin", "event_manager", "staff"]);

    return json({ ...(data ?? {}), user_count: userCount ?? 1 });
  }

  // ── get_transactions ────────────────────────────────────────────────────────

  if (action === "get_transactions") {
    const page  = Number(payload.page  ?? 1);
    const limit = Number(payload.limit ?? 20);
    const from  = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("billing_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) return err(error.message, 500);
    return json({ transactions: data, total: count, page, limit });
  }

  // ── manual_credit (platform admin only) ────────────────────────────────────

  if (action === "manual_credit") {
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!adminRole) return err("Platform admin access required", 403);

    const { target_user_id, amount, description } = payload;
    if (!target_user_id || !amount || amount <= 0) return err("Invalid manual credit params");

    const { data: newBalance, error: creditErr } = await supabase.rpc("credit_wallet", {
      _user_id:      target_user_id,
      _amount:       Number(amount),
      _category:     "adjustment",
      _description:  `${description || "Manual credit"} (by ${user.id} at ${new Date().toISOString()})`,
      _reference_id: null,
    });

    if (creditErr) return err(creditErr.message, 500);
    return json({ success: true, new_balance: newBalance });
  }

  return err("Unknown action", 400);
});
