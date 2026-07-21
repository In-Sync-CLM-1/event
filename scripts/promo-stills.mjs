// Capture crisp module stills for the premium promo (device-frame hero shots).
import { chromium } from 'playwright';
import { login, BASE, initEventId } from './lib/app.mjs';
import { loadEnv } from './lib/env.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const env = loadEnv(new URL('../.env', import.meta.url));
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'assets', 'promo');
mkdirSync(out, { recursive: true });
const EVENT_ID = await initEventId();
const PW = env.EVENT_DEMO_PASSWORD;
const VP = { width: 1600, height: 1000 };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await login(page, env.EVENT_ADMIN_EMAIL || 'rahul@techfest-demo.in', PW);

const shot = async (name, url, waitText, extra) => {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  if (waitText) await page.getByText(waitText).first().waitFor({ timeout: 25000 }).catch(() => {});
  if (extra) await extra(page).catch(() => {});
  await page.mouse.move(2, 2); // park the cursor so no chart tooltip freezes into the shot
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log('  shot', name);
};

await shot('page', `/admin/events/${EVENT_ID}/landing`, /Add Sections|About the Summit/);
await shot('sessions', `/admin/events/${EVENT_ID}/sessions`, /Opening Keynote|Session/);
await shot('venue', `/admin/events/new`, /Create Event/, async (p) => {
  await p.locator('#title').fill('Innovation Summit 2027').catch(() => {});
  const f = p.getByRole('combobox').nth(1); await f.click(); await p.waitForTimeout(300);
  await p.getByRole('option', { name: /hybrid/i }).first().click();
});
await shot('certs', `/admin/events/${EVENT_ID}/certificates`, /Certificate/);
await shot('content', `/admin/events/${EVENT_ID}/content`, /PRD Template|Pre-Read|Content/);
await shot('analytics', `/admin/events/${EVENT_ID}/analytics`, /Analytics/, async (p) => { await p.waitForTimeout(2500); });
await shot('reminders', `/admin/events/${EVENT_ID}/reminders`, /Reminder Loop/);
await shot('checkin', `/admin/check-in/${EVENT_ID}`, /Check-In/, async (p) => {
  await p.getByRole('tab', { name: /manual|search/i }).first().click().catch(() => {});
  await p.waitForTimeout(800);
});
await shot('engagement', `/admin/events/${EVENT_ID}/engagement`, /Engagement Scoring/);
await shot('performance', `/admin/performance`, /Sales-Ready Leads/, async (p) => {
  await p.waitForTimeout(2500); // let recharts draw both charts
});
await ctx.close();

const ctx2 = await browser.newContext({ viewport: VP, deviceScaleFactor: 2 });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}/events/product-summit-2026`, { waitUntil: 'networkidle' });
await p2.getByText(/Product Summit 2026/).first().waitFor({ timeout: 25000 }).catch(() => {});
await p2.waitForTimeout(1500);
await p2.screenshot({ path: join(out, 'register.png') });
await ctx2.close();
await browser.close();
console.log('done');
