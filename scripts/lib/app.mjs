// Eventsync app driver: email+password login.
// Records against the direct Cloudflare Pages URL to avoid the apex domain's
// Cloudflare managed-challenge which intercepts headless browsers.
import { loadEnv } from './env.mjs';

const env = loadEnv(new URL('../../.env', import.meta.url));

export const BASE = 'https://event-sync.pages.dev';

export const ORG = { name: 'TechFest India' };

export const ACCOUNTS = {
  admin:    { email: env.EVENT_ADMIN_EMAIL    || 'rahul@techfest-demo.in' },
  attendee: { email: env.EVENT_ATTENDEE_EMAIL || 'priya@techfest-demo.in' },
  attendee2:{ email: env.EVENT_ATTENDEE2_EMAIL|| 'arjun@techfest-demo.in' },
};

// Populated by initEventId() before recording begins — ESM live binding,
// scenes.mjs imports this and sees the updated value at call time.
export let EVENT_ID = null;
export let CERT_NUMBER = 'CERT-PS2026-0001';

export async function initEventId() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/events?slug=eq.product-summit-2026&select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      },
    }
  );
  const rows = await res.json();
  if (!rows?.length) throw new Error('Product Summit event not found — run seed-demo first');
  EVENT_ID = rows[0].id;

  // Also grab the first certificate number for the verify scene
  const cres = await fetch(
    `${SUPABASE_URL}/rest/v1/certificates?event_id=eq.${EVENT_ID}&order=issued_at.asc&limit=1&select=certificate_number`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
      },
    }
  );
  const crows = await cres.json();
  if (crows?.length) CERT_NUMBER = crows[0].certificate_number;
  return EVENT_ID;
}

// Login: fill email + password, click Sign in, require BOTH the dashboard URL AND
// a persisted Supabase session token. Retry up to 6× to guard against the
// "toast fires but session never writes" race.
export async function login(page, email, password) {
  const attempt = async () => {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.locator('#email').fill(email, { timeout: 25000 });
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    // Accept landing on / or /admin or /events (role-dependent redirects)
    await page.waitForURL(/\/(admin|events|my-events|$)/, { timeout: 20000 });
    await page.waitForFunction(
      () => Object.keys(localStorage).some(k => /sb-.*-auth-token/.test(k) && localStorage.getItem(k)),
      undefined, { timeout: 8000 },
    );
  };
  let err;
  for (let i = 0; i < 6; i++) {
    try {
      await attempt();
      await page.waitForLoadState('networkidle').catch(() => {});
      return;
    } catch (e) {
      err = e;
      await page.waitForTimeout(1500);
    }
  }
  throw err;
}
