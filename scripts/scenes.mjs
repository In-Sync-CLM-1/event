import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { BASE, ORG, EVENT_ID, CERT_NUMBER } from './lib/app.mjs';
import { ACCT } from './lib/scene.mjs';
import {
  caption, removeCaption, ring, removeAnn,
  zoomTo, zoomReset, dim, showCard, hideCard,
} from './lib/annotate.mjs';
import { clickLocator, moveToLocator } from './lib/cursor.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const notifDir = join(here, 'recordings', 'notif');

// ── shared helpers ────────────────────────────────────────────────────────────

export function titleCard(page, { kicker = 'Eventsync', headline, body, stats = [] }) {
  return page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{width:1366px;height:768px;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0f0a1e;overflow:hidden;display:grid;grid-template-columns:1.1fr 0.9fr}
    .left{padding:96px 72px;display:flex;flex-direction:column;justify-content:center;background:#0f0a1e}
    .right{background:#7c3aed;display:flex;align-items:center;justify-content:center;padding:56px 44px;position:relative;overflow:hidden}
    .right::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 40%,rgba(167,139,250,.3) 0%,transparent 65%)}
    .k{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a78bfa;margin-bottom:28px}
    h1{font-size:52px;line-height:1.06;color:#fff;font-weight:850;letter-spacing:-.01em;margin-bottom:20px}
    .sub{font-size:20px;line-height:1.5;color:rgba(255,255,255,.65);max-width:560px}
    .panel{width:100%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:32px;position:relative;z-index:1}
    .row{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.15);font-size:17px;color:rgba(255,255,255,.85)}
    .row:last-child{border-bottom:none}
    .v{font-weight:800;font-size:20px;color:#fff}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:rgba(255,255,255,.15);color:#e9d5ff;margin-left:8px}
    .foot{position:absolute;left:72px;bottom:40px;color:rgba(255,255,255,.3);font-size:14px}
  </style></head><body>
    <div class="left">
      <div class="k">${kicker}</div>
      <h1>${headline}</h1>
      <p class="sub">${body}</p>
    </div>
    <div class="right">
      <div class="panel">
        ${stats.map(s => `<div class="row"><span>${s.label}</span><span class="v">${s.value}${s.badge ? `<span class="badge">${s.badge}</span>` : ''}</span></div>`).join('')}
      </div>
    </div>
    <div class="foot">${ORG.name}</div>
  </body></html>`);
}

async function waitText(page, text, timeout = 25000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

// Client-side route change (no full reload → no white flash mid-scene).
// Falls back to a hard goto if the SPA doesn't pick up the route.
async function spaNav(page, path, expectText) {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  try {
    await page.getByText(expectText, { exact: false }).first().waitFor({ timeout: 6000 });
  } catch {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await waitText(page, expectText);
  }
}

// ── scenes ────────────────────────────────────────────────────────────────────

export const SCENE_MAP = {

  // ── 0. INTRO ─────────────────────────────────────────────────────────────
  's0-open': {
    name: 's0-open',
    account: ACCT.guest,
    narration: 'Most events are still organized with a spreadsheet, a WhatsApp group, and a prayer. Attendee details live in email threads. Check-in means printed lists and a marker at the door. After it is over, nobody knows what worked. This is Eventsync — built for the people who care too much about their events to run them that way.',
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'Eventsync · Event Management Platform',
        headline: 'Your event deserves better than a spreadsheet',
        body: 'From first registration to final analytics — one platform for every event, every attendee, every moment.',
        stats: [
          { label: 'Registrations managed', value: '300+', badge: 'live' },
          { label: 'Sessions tracked',       value: '7' },
          { label: 'Certificates issued',    value: 'Bulk, verified' },
          { label: 'Engagement scored',      value: 'Hot → Passive' },
        ],
      });
      const waitUntil = await ready(400);
      await waitUntil(D);
    },
  },

  // ── 1. ADMIN DASHBOARD ────────────────────────────────────────────────────
  's1-dashboard': {
    name: 's1-dashboard',
    account: ACCT.admin,
    narration: 'Rahul runs Product Summit — South India\'s biggest product management conference. The moment he logs in as event manager, the dashboard shows everything at once: all his events, how many are live, total registrations across the portfolio, and how many attendees have already been checked in today.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
      await waitText(page, 'Dashboard');
      // Wait for the stat cards to resolve real numbers (no em-dash placeholders)
      await page.waitForFunction(
        () => !document.body.innerText.includes('—'),
        undefined, { timeout: 20000 },
      ).catch(() => {});
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Event manager dashboard — the full picture on login');
      await waitUntil(at('logs in', 5, -0.2));
      const r1 = await ring(page, page.getByText('Total Events').first(), { label: 'All events' });
      await waitUntil(at('live', 9, -0.2));
      if (r1) await removeAnn(page, r1);
      const r2 = await ring(page, page.getByText('Total Registrations').first(), { label: 'Registrations' });
      await waitUntil(at('checked in', 15, -0.2));
      if (r2) await removeAnn(page, r2);
      const r3 = await ring(page, page.getByText('Check-ins Today').first(), { label: 'Today\'s check-ins' });
      await waitUntil(D - 1.2);
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  // ── 2. CREATE EVENT ───────────────────────────────────────────────────────
  's2-create-event': {
    name: 's2-create-event',
    account: ACCT.admin,
    narration: 'Building a new event takes one form. Title, dates, venue — the URL slug writes itself from the title. Pick the event type — conference, trade fair, roadshow, workshop, or product launch — Eventsync runs offline events as naturally as online ones. And the format selector opens a virtual join URL field the moment you choose Hybrid or Virtual. Set the capacity, the registration deadline, flip the status to Published, and the event is live for registrations in under two minutes.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/new`, { waitUntil: 'networkidle' });
      await waitText(page, 'Create Event');
      const waitUntil = await ready(1000);
      const cap = await caption(page, 'Create event — title to live in under two minutes');
      // Fill title to show slug auto-generation
      await waitUntil(at('Title', 3, -0.1));
      const titleInput = page.locator('#title');
      await moveToLocator(page, titleInput, 600);
      await titleInput.fill('Innovation Conclave 2027');
      await page.waitForTimeout(600);
      const r1 = await ring(page, page.locator('#slug'), { label: 'Slug auto-generates from title', below: true });
      await waitUntil(at('event type', 8, -0.2));
      if (r1) await removeAnn(page, r1);
      // Event type: conference / trade fair / roadshow / workshop / product launch
      const typeTrigger = page.locator('#event_type');
      await typeTrigger.scrollIntoViewIfNeeded().catch(() => {});
      await moveToLocator(page, typeTrigger, 700);
      await typeTrigger.click();
      await page.waitForTimeout(400);
      const tradeFairOption = page.getByRole('option', { name: /trade fair/i });
      await tradeFairOption.waitFor({ timeout: 8000 });
      const rT = await ring(page, tradeFairOption, { label: 'Offline formats: trade fairs, roadshows, workshops', below: true });
      await waitUntil(at('product launch', 12, -0.2));
      if (rT) await removeAnn(page, rT);
      await page.getByRole('option', { name: /^conference$/i }).click().catch(() => tradeFairOption.click());
      await page.waitForTimeout(400);
      await waitUntil(at('format selector', 15, -0.2));
      // Show format dropdown (second combobox — event type is the first)
      const formatTrigger = page.getByRole('combobox').nth(1);
      await moveToLocator(page, formatTrigger, 700);
      await formatTrigger.click();
      await page.waitForTimeout(400);
      const hybridOption = page.getByRole('option', { name: /hybrid/i });
      await hybridOption.waitFor({ timeout: 8000 });
      const r2 = await ring(page, hybridOption, { label: 'Hybrid: in-person + online', below: true });
      await waitUntil(at('join URL', 18, -0.2));
      if (r2) await removeAnn(page, r2);
      await hybridOption.click();
      await page.waitForTimeout(500);
      // Join URL field appears
      const joinUrl = page.locator('#virtual_join_url');
      await joinUrl.waitFor({ timeout: 8000 }).catch(() => {});
      const r3 = await ring(page, joinUrl.or(page.getByText('Stream / Join URL').first()).first(), { label: 'Stream URL unlocks for hybrid/virtual', below: true });
      await waitUntil(at('Published', 21, -0.2));
      if (r3) await removeAnn(page, r3);
      // Show status dropdown
      const statusSelect = page.getByRole('combobox').last();
      await moveToLocator(page, statusSelect, 700);
      await statusSelect.click();
      await page.waitForTimeout(400);
      const publishedOpt = page.getByRole('option', { name: /published/i });
      await publishedOpt.waitFor({ timeout: 8000 }).catch(() => {});
      const r4 = await ring(page, publishedOpt, { label: 'Published → live immediately' });
      await waitUntil(D - 1.2);
      if (r4) await removeAnn(page, r4);
      await page.keyboard.press('Escape');
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  // ── 3. LANDING PAGE BUILDER ───────────────────────────────────────────────
  's3-landing-builder': {
    name: 's3-landing-builder',
    account: ACCT.admin,
    narration: 'The page attendees see is built, not templated. The landing page editor gives Rahul six section types to compose with — hero banner, about, speakers grid, agenda, sponsors, and a call-to-action. The speakers section auto-populates from the event data. The agenda pulls from the session list. Publish, and every attendee lands on a custom event page at the same URL — no developer, no code.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/landing`, { waitUntil: 'networkidle' });
      // Wait for the builder to finish loading, with the seeded sections in the preview
      await page.getByText('Add Sections', { exact: false }).first().waitFor({ timeout: 30000 });
      await page.getByText('About the Summit', { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
      const waitUntil = await ready(1500);
      const cap = await caption(page, 'Visual landing page builder — six drag-and-drop sections');
      await waitUntil(at('editor', 5, -0.2));
      // Ring the section palette
      const palette = page.getByText('Add Sections', { exact: false }).first();
      const r1 = await ring(page, palette, { label: '6 section types to compose with' });
      await waitUntil(at('speakers', 12, -0.2));
      if (r1) await removeAnn(page, r1);
      // Ring the Speakers section type in palette
      const speakersSection = page.getByText('Speakers Grid', { exact: false }).first();
      const r2 = await ring(page, speakersSection, { label: 'Auto-populates from event speakers' });
      await waitUntil(at('agenda', 16, -0.2));
      if (r2) await removeAnn(page, r2);
      const agendaSection = page.getByText('Agenda / Schedule', { exact: false }).first();
      const r3 = await ring(page, agendaSection, { label: 'Pulls from session list automatically' });
      await waitUntil(at('Publish', 21, -0.2));
      if (r3) await removeAnn(page, r3);
      // Zoom to publish area if there's a publish button
      const publishBtn = page.getByRole('button', { name: /publish/i }).first();
      await moveToLocator(page, publishBtn, 700).catch(() => {});
      const r4 = await ring(page, publishBtn, { label: 'Published → live on the event URL' }).catch(() => null);
      await waitUntil(D - 1.2);
      if (r4) await removeAnn(page, r4);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  // ── 4. SESSIONS + SPEAKERS ───────────────────────────────────────────────
  's4-sessions-speakers': {
    name: 's4-sessions-speakers',
    account: ACCT.admin,
    narration: 'Product Summit has seven sessions across two tracks. The sessions editor lets Rahul set each one\'s title, time slot, room, track label, and capacity — then assign one or more speakers to it. Drag to reorder the agenda in seconds. Over on the speakers page, each profile carries a bio, photo, title, company, and LinkedIn — the same data the landing page pulls in automatically. Nandini Rao, Chief Design Officer at TrustScore. Aarav Singh, Chief Revenue Officer at ShopLocal. Every profile, every credential, one place.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/sessions`, { waitUntil: 'networkidle' });
      await waitText(page, 'Opening Keynote');
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Session agenda — drag-and-drop, speaker-linked');
      await waitUntil(at('sessions editor', 5, -0.2));
      // Ring the first session
      const s1 = page.getByText('Opening Keynote: The Product Decade').first();
      await zoomTo(page, s1, 1.18, 900);
      const r1 = await ring(page, s1, { label: 'Session: time slot, room, track, capacity' });
      await waitUntil(at('Drag to reorder', 12, -0.2));
      if (r1) await removeAnn(page, r1);
      await zoomReset(page, 600);
      // Ring a second session
      const s2 = page.getByText('Zero to PMF').first();
      const r2 = await ring(page, s2, { label: 'Track A — separate stream' }).catch(() => null);
      await waitUntil(at('speakers page', 18, -0.2));
      if (r2) await removeAnn(page, r2);
      await removeCaption(page, cap);
      // Navigate to speakers (client-side — no reload flash)
      await spaNav(page, `/admin/events/${EVENT_ID}/speakers`, 'Shreya Agarwal');
      await page.waitForTimeout(800);
      const cap2 = await caption(page, 'Speaker profiles — bio, photo, LinkedIn, company');
      // Highlight exactly who the narration names, when it names them
      await waitUntil(at('Nandini Rao', 22, -0.2));
      const nandini = page.getByText('Nandini Rao').first();
      await zoomTo(page, nandini, 1.25, 900);
      const r3 = await ring(page, nandini, { label: 'Chief Design Officer, TrustScore' });
      await waitUntil(at('Aarav Singh', 26, -0.2));
      if (r3) await removeAnn(page, r3);
      await zoomReset(page, 500);
      const aarav = page.getByText('Aarav Singh').first();
      await aarav.scrollIntoViewIfNeeded().catch(() => {});
      await zoomTo(page, aarav, 1.25, 900);
      const r4 = await ring(page, aarav, { label: 'Chief Revenue Officer, ShopLocal' });
      await waitUntil(D - 1.0);
      if (r4) await removeAnn(page, r4);
      await zoomReset(page, 600);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 5. ATTENDEE: EVENT PAGE + MY SCHEDULE ────────────────────────────────
  's5-attendee-event': {
    name: 's5-attendee-event',
    account: ACCT.attendee,
    narration: 'This is what Priya sees. She lands on the custom page Rahul built — hero banner, the four speaker profiles, the full agenda. She finds the afternoon panel and adds it to her personal schedule in one tap. The My Schedule view shows her bookmarked sessions by day. One more tap downloads an ICS file that drops straight into Google Calendar or Outlook.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/events/product-summit-2026`, { waitUntil: 'networkidle' });
      await waitText(page, 'Product Summit 2026');
      const waitUntil = await ready(1500);
      const cap = await caption(page, 'Attendee view — the custom page Rahul published');
      await waitUntil(at('speaker profiles', 7, -0.2));
      // Scroll to find speakers
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(600);
      // Ring a speaker card
      const shreya = page.getByText('Shreya Agarwal').first();
      const r1 = await ring(page, shreya, { label: 'Speaker profiles auto-populated' }).catch(() => null);
      await waitUntil(at('agenda', 11, -0.2));
      if (r1) await removeAnn(page, r1);
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(600);
      await removeCaption(page, cap);
      // Try to find "Add to My Schedule" button or similar
      const cap2 = await caption(page, 'Add any session to personal schedule — one tap');
      await waitUntil(at('adds it', 15, -0.2));
      const addBtn = page.getByRole('button', { name: /schedule|bookmark|add/i }).first();
      await moveToLocator(page, addBtn, 700).catch(() => {});
      const r2 = await ring(page, addBtn, { label: 'Add to My Schedule' }).catch(() => null);
      await waitUntil(at('My Schedule', 19, -0.2));
      if (r2) await removeAnn(page, r2);
      await removeCaption(page, cap2);
      // Navigate to My Schedule (client-side — no reload flash)
      await spaNav(page, '/events/product-summit-2026/my-schedule', 'My Schedule');
      await page.waitForTimeout(1000);
      const cap3 = await caption(page, 'My Schedule — ICS download for any calendar app');
      await waitUntil(at('ICS file', 23, -0.2));
      const icsBtn = page.getByRole('button', { name: /calendar|ics|download/i }).first();
      const r3 = await ring(page, icsBtn, { label: 'Download ICS → Google Calendar / Outlook' }).catch(() => null);
      await waitUntil(D - 1.0);
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap3);
      await waitUntil(D);
    },
  },

  // ── 6. REGISTRATION ───────────────────────────────────────────────────────
  's6-registration': {
    name: 's6-registration',
    account: ACCT.guest,
    narration: 'Someone new — Neha, CEO of StartupGrowth India — found the event and wants in. She scrolls to the registration section, fills in her name, email, phone, company, and role, and submits. Her registration number generates in seconds. No account required, no email loop to confirm. She is in the system, confirmed, and the check-in desk can find her by name on the day.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/events/product-summit-2026`, { waitUntil: 'networkidle' });
      await waitText(page, 'Product Summit 2026');
      const waitUntil = await ready(1200);
      // Bring the registration card fully into view (centre it — the old
      // scrollIntoViewIfNeeded no-oped when the card was half-visible)
      await waitUntil(at('registration section', 5, -0.2));
      const nameField = page.locator('#full_name');
      await nameField.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      await page.waitForTimeout(900);
      const cap = await caption(page, 'Registration — no account needed');
      await waitUntil(at('name', 8, -0.2));
      await moveToLocator(page, nameField, 600).catch(() => {});
      await nameField.fill('Neha Kapoor');
      await page.waitForTimeout(350);
      await page.locator('#email').fill('neha@startupgrowth.in');
      await page.waitForTimeout(350);
      await page.locator('#phone').fill('+91 98204 56789');
      await page.waitForTimeout(350);
      await page.locator('#company').fill('StartupGrowth India');
      await page.waitForTimeout(350);
      await page.locator('#designation').fill('CEO');
      await waitUntil(at('submits', 15, -0.2));
      const submitBtn = page.getByRole('button', { name: /register for event/i }).first();
      await submitBtn.scrollIntoViewIfNeeded().catch(() => {});
      const r1 = await ring(page, submitBtn, { label: 'Register — confirmation instant' }).catch(() => null);
      await clickLocator(page, submitBtn, { dur: 600 });
      if (r1) await removeAnn(page, r1);
      // Confirmation replaces the form: number + QR code
      await page.getByText("You're Registered!", { exact: false }).first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(500);
      await waitUntil(at('registration number', 18, -0.2));
      const conf = page.getByText(/Registration #/i).first();
      await conf.scrollIntoViewIfNeeded().catch(() => {});
      const r2 = await ring(page, conf, { label: 'Unique registration number + QR issued' }).catch(() => null);
      await waitUntil(D - 1.0);
      if (r2) await removeAnn(page, r2);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  // ── 6b. REMINDER LOOP (WhatsApp + AI calls) ──────────────────────────────
  's6b-reminders': {
    name: 's6b-reminders',
    account: ACCT.admin,
    narration: 'Registration is only half the job — people forget to show up. Eventsync closes that loop on its own. Every confirmed attendee gets a WhatsApp reminder the day before, with the date, the venue, and their registration number. And on event morning, an AI voice agent named Riya calls the ones still unconfirmed, politely checks if they are coming, and logs every outcome. Rahul flips the toggles once — the platform does the rest. Nearly three hundred WhatsApp reminders delivered, forty-two calls this morning, and Meena confirmed on the call before her first coffee. That is how seventy-two percent walk through the door.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/reminders`, { waitUntil: 'networkidle' });
      await waitText(page, 'Reminder Loop');
      await page.getByText(/WhatsApp Reminders/i).first().waitFor({ timeout: 15000 }).catch(() => {});
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Reminder loop — WhatsApp + AI calls, fully automatic');
      await waitUntil(at('closes that loop', 5, -0.2));
      // WhatsApp toggle + a real-looking message card
      const waToggle = page.getByText('WhatsApp reminders', { exact: false }).first();
      const r1 = await ring(page, waToggle, { label: 'Day before, every confirmed attendee' });
      await waitUntil(at('registration number', 12, -0.2));
      // Render the WhatsApp bubble as a notification card
      mkdirSync(notifDir, { recursive: true });
      const waPng = join(notifDir, 'wa-reminder.png');
      const cardPage = await page.context().newPage();
      await cardPage.setViewportSize({ width: 380, height: 240 });
      await cardPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
        body{margin:0;font-family:'Segoe UI',sans-serif;background:#0b141a;padding:14px}
        .bubble{background:#1f2c33;border-radius:0 12px 12px 12px;padding:12px 14px;color:#e9edef;font-size:13.5px;line-height:1.45;max-width:340px}
        .bubble b{color:#fff}
        .time{color:#8696a0;font-size:11px;text-align:right;margin-top:6px}
      </style></head><body>
        <div class="bubble">Hi <b>Meena</b>, this is a reminder for <b>Product Summit 2026</b> on <b>${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, 8:00 AM</b> at <b>NIMHANS Convention Centre, Bengaluru</b>. Your registration number is <b>PS2026-0005</b>. Show your QR code at the check-in desk to walk straight in. See you there!
          <div class="time">5:02 PM ✓✓</div>
        </div>
      </body></html>`);
      await cardPage.waitForTimeout(300);
      await cardPage.screenshot({ path: waPng });
      await cardPage.close();
      const cardId = await showCard(page, waPng, { label: 'WhatsApp · Eventsync', accent: '#25D366', top: 90, width: 330 });
      await waitUntil(at('AI voice agent', 16, -0.2));
      if (r1) await removeAnn(page, r1);
      await hideCard(page, cardId);
      const callToggle = page.getByText('AI reminder calls', { exact: false }).first();
      const r2 = await ring(page, callToggle, { label: 'Riya calls the unconfirmed — outcome logged' });
      await waitUntil(at('flips the toggles', 22, -0.2));
      if (r2) await removeAnn(page, r2);
      // Stats row
      const statCard = page.getByText('WhatsApp Reminders', { exact: false }).first();
      const r3 = await ring(page, statCard, { label: 'The whole wave, logged' }).catch(() => null);
      await waitUntil(at('forty-two calls', 26, -0.2));
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap);
      // Scroll to the log and ring Meena's confirmed call
      const cap2 = await caption(page, 'Every reminder, every call outcome — one log');
      await page.getByText('Reminder Log', { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(600);
      await waitUntil(at('Meena confirmed', 29, -0.2));
      const meenaRow = page.getByText('Meena Pillai').first();
      await meenaRow.scrollIntoViewIfNeeded().catch(() => {});
      await zoomTo(page, meenaRow, 1.2, 800);
      const r4 = await ring(page, meenaRow, { label: 'AI call · Confirmed — will attend', below: true }).catch(() => null);
      await waitUntil(D - 1.2);
      if (r4) await removeAnn(page, r4);
      await zoomReset(page, 600);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 7. QR CHECK-IN ────────────────────────────────────────────────────────
  's7-checkin': {
    name: 's7-checkin',
    account: ACCT.admin,
    narration: 'Event day. The check-in desk runs on any device. Live stats across the top — total registered, total checked in, today\'s count, and the attendance rate — update every time a scan fires. The QR scanner reads the attendee\'s phone in under a second. Or switch to manual search: type a name, find the row, one click. Rahul can see the attendance rate climbing in real time, no refresh needed.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/check-in/${EVENT_ID}`, { waitUntil: 'networkidle' });
      await waitText(page, 'Check-In');
      // Wait for real stats (3-digit registered count), not zeros mid-load
      await page.waitForFunction(
        () => /Total Registered/.test(document.body.innerText) && /\d{3}/.test(document.body.innerText),
        undefined, { timeout: 20000 },
      ).catch(() => {});
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Check-in desk — QR scan or manual search, live stats');
      await waitUntil(at('Live stats', 5, -0.2));
      // Ring the stats area
      const statsArea = page.getByText(/Total Registered/i).first();
      const r1 = await ring(page, statsArea, { label: 'Live attendance stats' });
      await waitUntil(at('attendance rate', 9, -0.2));
      if (r1) await removeAnn(page, r1);
      const rateEl = page.getByText(/Attendance Rate/i).first();
      const r2 = await ring(page, rateEl, { label: 'Attendance rate — live' }).catch(() => null);
      await waitUntil(at('QR scanner', 12, -0.2));
      if (r2) await removeAnn(page, r2);
      // Ring QR Scanner tab
      const qrTab = page.getByRole('tab', { name: /qr/i }).first();
      const r3 = await ring(page, qrTab, { label: 'QR: reads attendee phone < 1 second' });
      await waitUntil(at('manual search', 15, -0.2));
      if (r3) await removeAnn(page, r3);
      // Switch to manual search and check Neha in for real
      const manualTab = page.getByRole('tab', { name: /manual|search/i }).first();
      await clickLocator(page, manualTab, { dur: 600 });
      await page.waitForTimeout(500);
      const searchBox = page.getByPlaceholder(/search|name|email/i).first();
      await moveToLocator(page, searchBox, 600).catch(() => {});
      await searchBox.fill('Neha').catch(() => {});
      await page.getByRole('button', { name: /^search$/i }).first().click().catch(() => {});
      await page.getByText('Neha Kapoor').first().waitFor({ timeout: 10000 }).catch(() => {});
      const result = page.getByText('Neha Kapoor').first();
      const r4 = await ring(page, result, { label: 'Found — one click to check in' }).catch(() => null);
      await waitUntil(at('one click', 19, -0.2));
      if (r4) await removeAnn(page, r4);
      await clickLocator(page, result, { dur: 500 }).catch(() => {});
      // Confirmation dialog → close → stats refresh live
      await page.getByText(/Checked In/i).first().waitFor({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await page.getByRole('button', { name: /continue scanning|try again/i }).first().click().catch(() => {});
      await page.waitForTimeout(900);
      const rate2 = page.getByText(/Attendance Rate/i).first();
      const r5 = await ring(page, rate2, { label: '72% — climbing with every scan' }).catch(() => null);
      await removeCaption(page, cap);
      await waitUntil(D - 1.0);
      if (r5) await removeAnn(page, r5);
      await waitUntil(D);
    },
  },

  // ── 8. CERTIFICATES ───────────────────────────────────────────────────────
  's8-certificates': {
    name: 's8-certificates',
    account: ACCT.admin,
    narration: 'After the event, certificates go out in bulk. The dialog lists every checked-in attendee who does not have a certificate yet — over two hundred of them. Select all, click Issue — done in seconds. Each certificate has a unique number and a public verification URL that anyone can open without logging in. Priya\'s certificate confirms her name, the event, the date — and shows Verified in green. Shareable on LinkedIn, trustworthy to any recruiter.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/certificates`, { waitUntil: 'networkidle' });
      await waitText(page, 'Certificate');
      const waitUntil = await ready(1300);
      const cap = await caption(page, 'Bulk certificate issuance — select all, issue, done');
      await waitUntil(at('dialog lists', 4, -0.2));
      // Open the bulk-issue dialog and actually run it
      const issueBtn = page.getByRole('button', { name: /issue certificates/i }).first();
      await clickLocator(page, issueBtn, { dur: 600 });
      await page.getByText(/Select All/i).first().waitFor({ timeout: 10000 });
      await page.waitForTimeout(500);
      const selectAll = page.locator('[role=dialog] [role=checkbox]').first();
      await waitUntil(at('Select all', 8, -0.2));
      await selectAll.click().catch(() => {});
      await page.waitForTimeout(500);
      const confirmBtn = page.getByRole('button', { name: /issue \d+ certificate/i }).first();
      const r1 = await ring(page, confirmBtn, { label: 'All eligible attendees — one click' }).catch(() => null);
      await waitUntil(at('click Issue', 11, -0.2));
      if (r1) await removeAnn(page, r1);
      await confirmBtn.click().catch(() => {});
      // Dialog closes when the batch lands
      await page.getByText(/Select All/i).first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const totalCard = page.getByText(/Total Issued/i).first();
      const r2 = await ring(page, totalCard, { label: 'Issued in one batch — seconds, not days' }).catch(() => null);
      await waitUntil(at('unique number', 16, -0.2));
      if (r2) await removeAnn(page, r2);
      const certRow = page.getByText(/CERT-/i).first();
      const r3b = await ring(page, certRow, { label: 'Unique certificate number' }).catch(() => null);
      await waitUntil(at('public verification', 19, -0.2));
      if (r3b) await removeAnn(page, r3b);
      await removeCaption(page, cap);
      // Public verify page (client-side — no reload flash)
      await spaNav(page, `/verify/${CERT_NUMBER}`, 'Certificate');
      await page.waitForTimeout(1000);
      const cap2 = await caption(page, 'Public certificate verify — no login, instant, shareable');
      await waitUntil(at('Verified in green', 23, -0.2));
      // Ring the Verified badge
      const verified = page.getByText(/Verified/i).first();
      await zoomTo(page, verified, 1.25, 900);
      const r3 = await ring(page, verified, { label: 'Verified — anyone can confirm it' });
      await waitUntil(at('LinkedIn', 27, -0.2));
      if (r3) await removeAnn(page, r3);
      await zoomReset(page, 600);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 9. GAMIFICATION ──────────────────────────────────────────────────────
  's9-gamification': {
    name: 's9-gamification',
    account: ACCT.admin,
    narration: 'Gamification is a real retention mechanic, not decoration. The leaderboard shows Priya at the top with four hundred and eighty points — earned through check-in, sessions attended, networking, and content viewed. The badges panel lets Rahul define what drives the behaviour he wants: Early Bird, Networker, Session Champion. The rewards panel ties points to something real — a signed book bundle at three hundred, a VIP after-party pass at five hundred. Priya has already claimed the notebook.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/gamification`, { waitUntil: 'networkidle' });
      await waitText(page, 'Priya Sharma');
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Leaderboard — real points from real actions');
      await waitUntil(at('leaderboard', 5, -0.2));
      const priyaRow = page.getByText('Priya Sharma').first();
      await zoomTo(page, priyaRow, 1.2, 900);
      const r1 = await ring(page, priyaRow, { label: '1st — 480 pts: sessions + networking + content' });
      await waitUntil(at('badges panel', 12, -0.2));
      if (r1) await removeAnn(page, r1);
      await zoomReset(page, 600);
      // Switch to badges tab and WAIT for its content before narrating over it
      const badgesTab = page.getByRole('tab', { name: /badge/i }).first()
        .or(page.getByRole('button', { name: /badge/i }).first())
        .or(page.getByText('Badges', { exact: true }).first());
      await clickLocator(page, badgesTab, { dur: 600 }).catch(() => {});
      await page.getByText('Early Bird', { exact: false }).first().waitFor({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(400);
      await removeCaption(page, cap);
      const cap2 = await caption(page, 'Badges — define the behaviour you want to reward');
      await waitUntil(at('Session Champion', 17, -0.2));
      const networkBadge = page.getByText('Networker').first();
      const r2 = await ring(page, networkBadge, { label: 'Networker — connects with 5+ attendees' }).catch(() => null);
      await waitUntil(at('rewards panel', 21, -0.2));
      if (r2) await removeAnn(page, r2);
      // Switch to rewards tab and WAIT for its content — the old cut narrated
      // the rewards panel while the leaderboard was still on screen
      const rewardsTab = page.getByRole('tab', { name: /reward/i }).first()
        .or(page.getByRole('button', { name: /reward/i }).first())
        .or(page.getByText('Rewards', { exact: true }).first());
      await clickLocator(page, rewardsTab, { dur: 600 }).catch(() => {});
      await page.getByText(/VIP After-Party/i).first().waitFor({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(400);
      await removeCaption(page, cap2);
      const cap3 = await caption(page, 'Rewards — real outcomes tied to engagement points');
      const bookBundle = page.getByText(/Speaker Book Bundle/i).first();
      const rB = await ring(page, bookBundle, { label: '300 pts — signed book bundle' }).catch(() => null);
      await waitUntil(at('after-party pass', 26, -0.2));
      if (rB) await removeAnn(page, rB);
      const vipReward = page.getByText(/VIP After-Party/i).first();
      const r3 = await ring(page, vipReward, { label: '500 pts — VIP after-party pass' }).catch(() => null);
      await waitUntil(D - 1.0);
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap3);
      await waitUntil(D);
    },
  },

  // ── 10. NETWORKING ───────────────────────────────────────────────────────
  's10-networking': {
    name: 's10-networking',
    account: ACCT.attendee,
    narration: 'Three hundred product minds in one building. The networking page turns that into actual conversations. Priya can search the full attendee list by name or company, toggle to show only people with LinkedIn profiles, and send a meeting request with a personal message. She checks her requests panel — Kavya from TechForge sent one this morning. One tap to accept, and the meeting is locked in.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/events/${EVENT_ID}/networking`, { waitUntil: 'networkidle' });
      await waitText(page, 'Arjun Nair');
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Networking — every attendee, searchable');
      await waitUntil(at('attendee list', 7, -0.2));
      // Ring the search box
      const searchBox = page.getByPlaceholder(/search/i).first();
      const r1 = await ring(page, searchBox, { label: 'Search by name or company' });
      await waitUntil(at('LinkedIn profiles', 11, -0.2));
      if (r1) await removeAnn(page, r1);
      // LinkedIn toggle
      const linkedinToggle = page.getByText(/LinkedIn/i).first();
      const r2 = await ring(page, linkedinToggle, { label: 'Filter to LinkedIn-visible attendees only' }).catch(() => null);
      await waitUntil(at('meeting request', 15, -0.2));
      if (r2) await removeAnn(page, r2);
      // Click on Arjun to send a meeting request
      await moveToLocator(page, searchBox, 500).catch(() => {});
      await searchBox.fill('Arjun').catch(() => {});
      await page.waitForTimeout(800);
      const arjunCard = page.getByText('Arjun Nair').first();
      const r3 = await ring(page, arjunCard, { label: 'Select attendee → send meeting request' }).catch(() => null);
      await waitUntil(at('requests panel', 19, -0.2));
      if (r3) await removeAnn(page, r3);
      // Clear search and show incoming requests
      await searchBox.fill('').catch(() => {});
      await page.waitForTimeout(600);
      await removeCaption(page, cap);
      // Look for the meeting requests section
      const cap2 = await caption(page, 'Incoming requests — accept or decline');
      await waitUntil(at('Kavya', 22, -0.2));
      const kavyaReq = page.getByText('Kavya Reddy').first();
      const r4 = await ring(page, kavyaReq, { label: 'Kavya from TechForge — pending your reply', below: true }).catch(() => null);
      await waitUntil(at('accept', 25, -0.2));
      if (r4) await removeAnn(page, r4);
      const acceptBtn = page.getByRole('button', { name: /accept/i }).first();
      await moveToLocator(page, acceptBtn, 600).catch(() => {});
      const r5 = await ring(page, acceptBtn, { label: 'Accept — meeting confirmed' }).catch(() => null);
      await waitUntil(D - 1.0);
      if (r5) await removeAnn(page, r5);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 11. CONTENT LIBRARY ───────────────────────────────────────────────────
  's11-content': {
    name: 's11-content',
    account: ACCT.admin,
    narration: 'Content stays alive long after the last session ends. Rahul has uploaded three items — a pre-read PDF, the PRD workshop template, and the photo gallery. The workshop template is gated: only registered attendees can access it. The pre-read and gallery are public. Every attendee sees all of it in their Content Library, accessible from their event page, and it lives there indefinitely.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/content`, { waitUntil: 'networkidle' });
      await waitText(page, 'PRD Template');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Content library — PDFs, videos, slides, all in one place');
      await waitUntil(at('three items', 5, -0.2));
      const prereading = page.getByText(/Pre-Read|State of Indian/i).first();
      const r1 = await ring(page, prereading, { label: 'Pre-read PDF — available to all' });
      await waitUntil(at('PRD workshop template', 9, -0.2));
      if (r1) await removeAnn(page, r1);
      const prd = page.getByText(/PRD Template/i).first();
      await zoomTo(page, prd, 1.25, 900);
      const r2 = await ring(page, prd, { label: 'PRD Template — registered attendees only (gated)' });
      await waitUntil(at('gated', 13, -0.2));
      if (r2) await removeAnn(page, r2);
      // Un-zoom FIRST, then ring the Gated badge — a ring drawn during zoom
      // goes stale (floats over the wrong cell) once the transform resets
      await zoomReset(page, 600);
      await page.waitForTimeout(700);
      const gatedBadge = page.getByText('Gated', { exact: true }).first();
      const r3 = await ring(page, gatedBadge, { label: 'Gated: requires registration' }).catch(() => null);
      await waitUntil(at('Content Library', 19, -0.2));
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap);
      // Switch to attendee view (client-side — no reload flash)
      await spaNav(page, `/events/${EVENT_ID}/content`, 'Pre-Read');
      await page.waitForTimeout(1000);
      const cap2 = await caption(page, 'Attendee view — Content Library on their event page');
      const r4 = await ring(page, page.getByText(/Pre-Read|State of Indian/i).first(), { label: 'Public — visible to all attendees' }).catch(() => null);
      await waitUntil(D - 1.0);
      if (r4) await removeAnn(page, r4);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 12. ENGAGEMENT SCORING ────────────────────────────────────────────────
  's12-engagement': {
    name: 's12-engagement',
    account: ACCT.admin,
    narration: 'Engagement scoring tells Rahul who is genuinely into the event and who has checked out. The system scores every attendee on check-in, sessions attended, networking activity, and content viewed — then places them into four tiers. Priya is Hot at ninety-two. She has been to three sessions, connected with five people, and downloaded the PRD template. Passive attendees at the bottom are the ones to re-engage before the next event.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/engagement`, { waitUntil: 'networkidle' });
      await waitText(page, 'Engagement Scoring');
      const waitUntil = await ready(1300);
      const cap = await caption(page, 'Engagement scoring — Hot / Warm / Engaged / Passive');
      await waitUntil(at('four tiers', 10, -0.2));
      // Ring tier distribution — use exact text, scroll into view first
      const hotTier = page.getByText('Hot', { exact: true }).first();
      await hotTier.scrollIntoViewIfNeeded().catch(() => {});
      const r1 = await ring(page, hotTier, { label: 'Hot — 90+ score, highly active' }).catch(() => null);
      await waitUntil(at('Priya is Hot', 15, -0.2));
      if (r1) await removeAnn(page, r1);
      // Ring Priya's row
      const priyaRow = page.getByText('Priya Sharma').first();
      await priyaRow.scrollIntoViewIfNeeded().catch(() => {});
      await zoomTo(page, priyaRow, 1.25, 900);
      const r2 = await ring(page, priyaRow, { label: 'Score: 92 · sessions + network + content' }).catch(() => null);
      await waitUntil(at('Passive', 22, -0.2));
      if (r2) await removeAnn(page, r2);
      await zoomReset(page, 600);
      // Ring Recalculate button
      const recalc = page.getByRole('button', { name: /recalculate/i }).first();
      const r3 = await ring(page, recalc, { label: 'Recalculate — one click, live scores' }).catch(() => null);
      await waitUntil(D - 1.2);
      if (r3) await removeAnn(page, r3);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  // ── 13. ANALYTICS ────────────────────────────────────────────────────────
  's13-analytics': {
    name: 's13-analytics',
    account: ACCT.admin,
    narration: 'The analytics dashboard turns the event into a set of decisions for next time. Check-in trends show the pattern — early badge pickup the evening before, then the morning rush on event day. Session popularity — the Opening Keynote drew the biggest crowd, and the PRD workshop hit its sixty-seat cap. Check-in rate: seventy-two percent, up from sixty-one percent last year. Engagement distribution across the four tiers. One view, the whole picture.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/analytics`, { waitUntil: 'networkidle' });
      await waitText(page, 'Analytics');
      const waitUntil = await ready(1400);
      const cap = await caption(page, 'Analytics — every decision you need for next time');
      await waitUntil(at('Check-in trends', 5, -0.2));
      // Ring the check-in trends chart
      const trendChart = page.getByText(/Check-in Trends/i).first();
      const r1 = await ring(page, trendChart, { label: 'Badge pickup eve + event-day rush' });
      await waitUntil(at('Session popularity', 12, -0.2));
      if (r1) await removeAnn(page, r1);
      // Scroll down to charts
      await page.evaluate(() => window.scrollBy(0, 350));
      await page.waitForTimeout(600);
      // Ring session popularity chart
      const sessionChart = page.getByText(/Session Popularity/i).first();
      const r2 = await ring(page, sessionChart, { label: 'Session popularity — which rooms filled' }).catch(() => null);
      await waitUntil(at('Check-in rate', 19, -0.2));
      if (r2) await removeAnn(page, r2);
      // Ring the checked-in card
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const checkedIn = page.getByText(/Checked In/i).first();
      await zoomTo(page, checkedIn, 1.2, 800);
      const r3 = await ring(page, checkedIn, { label: 'Check-in rate: 72% (↑ from 61% last year)' });
      await waitUntil(at('Engagement distribution', 24, -0.2));
      if (r3) await removeAnn(page, r3);
      await zoomReset(page, 600);
      await page.waitForTimeout(400);
      const tiersChart = page.getByText(/Engagement Tiers/i).first();
      const r4 = await ring(page, tiersChart, { label: 'Hot / Warm / Engaged / Passive' }).catch(() => null);
      await removeCaption(page, cap);
      const cap2 = await caption(page, 'Engagement distribution — Hot / Warm / Engaged / Passive');
      await waitUntil(D - 1.0);
      if (r4) await removeAnn(page, r4);
      await removeCaption(page, cap2);
      await waitUntil(D);
    },
  },

  // ── 14. OUTRO ────────────────────────────────────────────────────────────
  's14-close': {
    name: 's14-close',
    account: ACCT.guest,
    narration: 'No spreadsheets. No printed check-in lists. No chasing people for certificates. From the first registration to the last analytics read — one system, built for events that deserve better than Excel.',
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'Eventsync · Event Management Platform',
        headline: 'From first registration\nto final analytics.',
        body: 'One platform. Every feature you need to run events that people talk about — and numbers that tell you why.',
        stats: [
          { label: 'Custom landing pages',     value: 'Built, not coded' },
          { label: 'Reminder loop',            value: 'WhatsApp + AI calls' },
          { label: 'Check-in',                 value: 'QR + manual' },
          { label: 'Certificates',             value: 'Bulk · verified' },
          { label: 'Engagement intelligence',  value: 'Hot → Passive' },
        ],
      });
      const waitUntil = await ready(400);
      await zoomTo(page, page.locator('.panel'), 1.06, 1000);
      await waitUntil(D - 1.5);
      await zoomReset(page, 700);
      await waitUntil(D);
    },
  },

};

const ORDER = [
  's0-open',
  's1-dashboard',
  's2-create-event',
  's3-landing-builder',
  's4-sessions-speakers',
  's5-attendee-event',
  's6-registration',
  's6b-reminders',
  's7-checkin',
  's8-certificates',
  's9-gamification',
  's10-networking',
  's11-content',
  's12-engagement',
  's13-analytics',
  's14-close',
];

export const SCENES = ORDER.map(n => SCENE_MAP[n]);
