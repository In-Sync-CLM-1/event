// EventSync teaser — v2 "1 main + 3 subsets" (approved storytelling standard).
//   MAIN    — EventSync runs the chase around your event; your team runs the event.
//   SUBSET 1 — confirmations run themselves (WhatsApp + AI calls → real numbers)
//   SUBSET 2 — event day is instant (QR check-in < 1s, live attendance)
//   SUBSET 3 — proof goes out in minutes (bulk certificates, publicly verifiable)
// Hook card names pain + product first; three numbered chapters; close restates
// main + subsets + "priced per event" + website-true demo CTA. Nothing else.
import { BASE, EVENT_ID, CERT_NUMBER } from './lib/app.mjs';
import { ACCT } from './lib/scene.mjs';
import { titleCard } from './scenes.mjs';
import { caption, removeCaption, ring, removeAnn } from './lib/annotate.mjs';

async function waitText(page, text, timeout = 25000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

export const TEASER_SCENES = [

  {
    name: 'e0-hook',
    account: ACCT.guest,
    narration: "You planned the event. But who's actually coming? EventSync runs the chase — so your team runs the event.",
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'EventSync · Event Management Platform',
        headline: 'You planned the event.\nWho’s actually coming?',
        body: 'EventSync runs the chase — your team runs the event.',
        stats: [
          { label: 'Confirmations', value: 'Run themselves' },
          { label: 'Check-in',      value: '< 1 second' },
          { label: 'Certificates',  value: 'Minutes, verified' },
        ],
      });
      const waitUntil = await ready(400);
      await waitUntil(D);
    },
  },

  {
    name: 'e1-confirm',
    account: ACCT.admin,
    narration: 'One — confirmations run themselves. WhatsApp reminders go out on their own, and an AI voice agent calls whoever stays silent — so you know your real numbers before the day.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/reminders`, { waitUntil: 'networkidle' });
      await waitText(page, 'Reminder Loop');
      await page.getByText(/WhatsApp Reminders/i).first().waitFor({ timeout: 15000 }).catch(() => {});
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'One · Confirmations — WhatsApp + AI calls, automatic');
      await waitUntil(at('WhatsApp reminders', 4, -0.2));
      const r1 = await ring(page, page.getByText('WhatsApp Reminders', { exact: false }).first(), { label: 'Sent on their own' });
      await waitUntil(at('AI voice agent', 7, -0.2));
      if (r1) await removeAnn(page, r1);
      const r2 = await ring(page, page.getByText('Confirmed on Call', { exact: false }).first(), { label: 'Said yes to the AI agent' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r2) await removeAnn(page, r2);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 'e2-checkin',
    account: ACCT.admin,
    narration: 'Two — event day is instant. QR check-in takes under a second, and attendance climbs live on the screen.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/check-in/${EVENT_ID}`, { waitUntil: 'networkidle' });
      await waitText(page, 'Check-In');
      await page.waitForFunction(
        () => /Total Registered/.test(document.body.innerText) && /\d{3}/.test(document.body.innerText),
        undefined, { timeout: 20000 },
      ).catch(() => {});
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Two · Check-in — under a second, no lists');
      await waitUntil(at('attendance', 5, -0.2));
      const r1 = await ring(page, page.getByText(/Attendance Rate/i).first(), { label: 'Climbing with every scan' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r1) await removeAnn(page, r1);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 'e3-certs',
    account: ACCT.guest,
    narration: 'Three — proof goes out in minutes. Certificates issue in bulk, and anyone can verify one — no login, shareable on LinkedIn.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/verify/${CERT_NUMBER}`, { waitUntil: 'networkidle' });
      await waitText(page, 'Certificate');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Three · Certificates — public verification, trust built in');
      await waitUntil(at('verify one', 4, -0.2));
      const verified = page.getByText(/Verified/i).first();
      const r1 = await ring(page, verified, { label: 'Anyone can confirm it' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r1) await removeAnn(page, r1);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 'e4-close',
    account: ACCT.guest,
    narration: "That's EventSync: it confirms, it checks in, it certifies — you run the room. Priced per event, quoted the same day. Book a free demo — bring your next event.",
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'EventSync · Event Management Platform',
        headline: 'It runs the chase.\nYou run the event.',
        body: 'Priced per event, quoted the same day · Book a free demo · event.in-sync.co.in',
        stats: [
          { label: 'Confirmations', value: 'Days of calling → automatic' },
          { label: 'Check-in',      value: 'Desk queue → under a second' },
          { label: 'Certificates',  value: 'An afternoon → minutes, verified' },
        ],
      });
      const waitUntil = await ready(400);
      await waitUntil(D);
    },
  },

];
