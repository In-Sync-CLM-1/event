// Scene runner for the continuous-narration pipeline.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from './env.mjs';
import * as V from './video.mjs';
import { installCursor } from './cursor.mjs';
import { login } from './app.mjs';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'recordings', 'scenes');
const env = loadEnv(new URL('../../.env', import.meta.url));
const VP = { width: 1366, height: 768 };

export const ACCT = {
  admin:     { email: env.EVENT_ADMIN_EMAIL     || 'rahul@techfest-demo.in',  password: env.EVENT_DEMO_PASSWORD },
  attendee:  { email: env.EVENT_ATTENDEE_EMAIL  || 'priya@techfest-demo.in',  password: env.EVENT_DEMO_PASSWORD },
  attendee2: { email: env.EVENT_ATTENDEE2_EMAIL || 'arjun@techfest-demo.in',  password: env.EVENT_DEMO_PASSWORD },
  guest: { guest: true },
};

// Bengaluru — NIMHANS Convention Centre area
const GEO = { latitude: 12.9352, longitude: 77.6245 };
const PHONE = { width: 390, height: 844 };

// Demo-only cosmetics injected into every page: hide the SDR tools nav group
// (CRM cross-sell links that confuse an event-platform walkthrough).
const DEMO_CSS = 'nav div:has(> a[href^="/sdr"]){display:none !important}';

export async function recordSceneVideo({ scene, slotStart, slotDuration, localFind, tailT = 0.5 }) {
  const browser = await chromium.launch({
    headless: true,
    // Fake camera so the QR scanner starts cleanly (no "Failed to start camera" toast)
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const recVP = scene.mobile ? PHONE : VP;
  let storageState;
  if (!scene.account.guest) {
    const a = await browser.newContext({ viewport: VP, geolocation: GEO, permissions: ['geolocation'] });
    const ap = await a.newPage();
    await login(ap, scene.account.email, scene.account.password);
    storageState = await a.storageState();
    await a.close();
  }
  const ctx = await browser.newContext({
    viewport: recVP, storageState, geolocation: GEO, permissions: ['geolocation', 'camera'],
    timezoneId: 'Asia/Kolkata', locale: 'en-IN',
    ...(scene.mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    recordVideo: { dir: outDir, size: recVP },
  });
  await ctx.addInitScript((css) => {
    const inject = () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.documentElement.appendChild(s);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
    else inject();
  }, DEMO_CSS);
  // Pre-warm pages the scene navigates to mid-recording (cuts white-load gaps)
  if (scene.warm) {
    const wp = await ctx.newPage();
    for (const url of scene.warm()) {
      await wp.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    }
    await wp.close();
  }
  const page = await ctx.newPage();
  let leadSec = 0, tBeats = 0;
  const t0 = Date.now();
  const ready = async (extra = 300) => {
    await page.waitForTimeout(extra);
    leadSec = (Date.now() - t0) / 1000;
    await installCursor(page);
    tBeats = Date.now();
    return async (s) => { const e = (Date.now() - tBeats) / 1000; if (e < s) await page.waitForTimeout((s - e) * 1000); };
  };
  const at = (phrase, fb, off = 0) => {
    const g = localFind(phrase);
    const local = g == null ? fb : g - slotStart;
    return Math.max(0, local) + off;
  };
  const D = slotDuration + tailT;
  try { await scene.beats({ page, find: localFind, at, D, ready }); }
  catch (e) {
    console.log(`[${scene.name}] beats error: ${e.message.split('\n')[0]}`);
    await ctx.close().catch(() => {});
    await browser.close().catch(() => {});
    throw e;
  }
  await ctx.close();
  await browser.close();
  const webm = await page.video().path();
  const mp4 = join(outDir, `${scene.name}-v.mp4`);
  if (scene.mobile) V.webmToMp4Phone(webm, mp4, leadSec, D);
  else V.webmToMp4(webm, mp4, leadSec, D);
  console.log(`[${scene.name}] video ${D.toFixed(2)}s (lead ${leadSec.toFixed(2)})${scene.mobile ? ' [mobile]' : ''}`);
  return mp4;
}
