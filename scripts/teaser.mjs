// 60-second teaser cut — hook, five fast proof moments, close.
// Rendered by render-teaser.mjs against the already-seeded demo state.
import { BASE, EVENT_ID, CERT_NUMBER } from './lib/app.mjs';
import { ACCT } from './lib/scene.mjs';
import { titleCard } from './scenes.mjs';
import { caption, removeCaption, ring, removeAnn, zoomTo, zoomReset } from './lib/annotate.mjs';

async function waitText(page, text, timeout = 25000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

export const TEASER_SCENES = [

  {
    name: 't0-hook',
    account: ACCT.guest,
    narration: 'What if your next event could run itself?',
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'Eventsync',
        headline: 'What if your event\ncould run itself?',
        body: 'Registrations. Reminders. Check-in. Certificates. Analytics. One platform.',
        stats: [
          { label: 'Registrations', value: '300+', badge: 'live' },
          { label: 'Reminder loop', value: 'WhatsApp + AI calls' },
          { label: 'Check-in',      value: '< 1 second' },
        ],
      });
      const waitUntil = await ready(400);
      await waitUntil(D);
    },
  },

  {
    name: 't1-page',
    account: ACCT.guest,
    narration: 'Meet Eventsync. Publish a custom event page and take registrations in minutes — no developer needed.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/events/product-summit-2026`, { waitUntil: 'networkidle' });
      await waitText(page, 'Product Summit 2026');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Custom event page — built, not coded');
      await waitUntil(at('registrations', 4, -0.2));
      await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
      await waitUntil(D - 0.8);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 't2-reminders',
    account: ACCT.admin,
    narration: 'It closes the loop for you. WhatsApp reminders go out on their own, and an AI voice agent calls anyone still unconfirmed.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/reminders`, { waitUntil: 'networkidle' });
      await waitText(page, 'Reminder Loop');
      await page.getByText(/WhatsApp Reminders/i).first().waitFor({ timeout: 15000 }).catch(() => {});
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'The reminder loop — WhatsApp + AI calls, automatic');
      await waitUntil(at('WhatsApp reminders', 4, -0.2));
      const r1 = await ring(page, page.getByText('WhatsApp Reminders', { exact: false }).first(), { label: 'Sent on their own' });
      await waitUntil(at('AI voice agent', 7, -0.2));
      if (r1) await removeAnn(page, r1);
      const r2 = await ring(page, page.getByText('Confirmed on Call', { exact: false }).first(), { label: 'Riya confirms attendance' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r2) await removeAnn(page, r2);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 't3-checkin',
    account: ACCT.admin,
    narration: 'On event day, QR check-in takes under a second — and you watch attendance climb in real time.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/check-in/${EVENT_ID}`, { waitUntil: 'networkidle' });
      await waitText(page, 'Check-In');
      await page.waitForFunction(
        () => /Total Registered/.test(document.body.innerText) && /\d{3}/.test(document.body.innerText),
        undefined, { timeout: 20000 },
      ).catch(() => {});
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'QR check-in — live attendance, no lists');
      await waitUntil(at('attendance', 5, -0.2));
      const r1 = await ring(page, page.getByText(/Attendance Rate/i).first(), { label: 'Climbing with every scan' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r1) await removeAnn(page, r1);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 't4-engage',
    account: ACCT.admin,
    narration: 'Points, badges, and rewards keep three hundred people networking — not just attending.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/gamification`, { waitUntil: 'networkidle' });
      await waitText(page, 'Priya Sharma');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Gamification — engagement you can measure');
      await waitUntil(at('badges', 4, -0.2));
      const priyaRow = page.getByText('Priya Sharma').first();
      await zoomTo(page, priyaRow, 1.15, 800);
      await waitUntil(D - 1.0);
      await zoomReset(page, 500);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 't5-certs',
    account: ACCT.guest,
    narration: 'Afterwards, certificates go out in bulk — publicly verifiable by anyone, shareable on LinkedIn.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/verify/${CERT_NUMBER}`, { waitUntil: 'networkidle' });
      await waitText(page, 'Certificate');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Public verification — trust built in');
      await waitUntil(at('verifiable', 4, -0.2));
      const verified = page.getByText(/Verified/i).first();
      const r1 = await ring(page, verified, { label: 'Anyone can confirm it' }).catch(() => null);
      await waitUntil(D - 0.8);
      if (r1) await removeAnn(page, r1);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    name: 't6-analytics',
    account: ACCT.admin,
    narration: 'And the analytics write the playbook for your next event.',
    beats: async ({ page, at, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/analytics`, { waitUntil: 'networkidle' });
      await waitText(page, 'Analytics');
      const waitUntil = await ready(1200);
      const cap = await caption(page, 'Every decision for next time — one view');
      await waitUntil(D - 0.8);
      await removeCaption(page, cap);
      await waitUntil(D);
    },
  },

  {
    // Numbers close: manual-vs-EventSync before/after + demo CTA (matches the
    // website's "book a free demo"; pricing is quoted per event, same day).
    name: 't7-close',
    account: ACCT.guest,
    narration: "Here's the shift: your team stops working the phone list and the check-in queue — and runs the event: the program, the guests, the room. Confirmations happen on their own; your people step in only where judgment is needed. Check-in drops from a queue to under a second. Certificates that ate an afternoon go out in minutes. Eventsync, by In-Sync. Book a demo — bring your next event.",
    beats: async ({ page, D, ready }) => {
      await titleCard(page, {
        kicker: 'Eventsync · Event Management Platform',
        headline: 'Your team runs the event.\nThe platform runs the chase.',
        body: 'Priced per event, quoted the same day · Book a demo · event.in-sync.co.in',
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
