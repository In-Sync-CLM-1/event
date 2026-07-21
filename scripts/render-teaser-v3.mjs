// EventSync teaser v3 — "buyer-question" cut, TWO orientations.
//   node scripts/render-teaser-v3.mjs      (FRESH_NARRATION=1, FRESH_VIDEO=1 force redo)
// Outputs:
//   C:\Users\Admin\Downloads\eventsync-teaser.mp4         (1920x1080)
//   C:\Users\Admin\Downloads\eventsync-teaser-mobile.mp4  (1080x1920)
//
// Story spine (screenplay: Downloads\eventsync-teaser-screenplay.md):
//   MOAT = "Registration is the easy part. EventSync runs the day."
//   problem card -> coverage montage -> 3 differentiators (Before/During/After
//   on ONE character, Priya Sharma / Product Summit 2026) -> numbers card -> CTA.
//
// Safety: live app, TechFest India demo tenant only. Every proof scene is a
// VIEW-ONLY read of seeded dashboards. Do NOT flip the reminder toggles (they
// can fire real WhatsApp/Bolna). Re-seed (node scripts/seed-demo.mjs) first.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';
import { BASE, initEventId } from './lib/app.mjs';
import { ACCT, recordSceneVideo } from './lib/scene.mjs';
import { synthTimed } from './lib/voice.mjs';
import * as V from './lib/video.mjs';

const FF = 'C:\\Users\\Admin\\scoop\\shims\\ffmpeg.exe';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'recordings', 'scenes');
const T_X = 0.4;

const EVENT_ID = await initEventId();
console.log(`EVENT_ID ${EVENT_ID}`);
const LOGO = 'data:image/png;base64,' +
  readFileSync(join(here, 'assets', 'insync-logo-band.png')).toString('base64');

// ── The 7 narration blocks (slots carved from ONE take) ───────────────────────
const NARR = {
  n0: "Your event is your big moment. So why run it on a Google Form, a WhatsApp group, and a list at the door? Forty percent never show up. EventSync runs the day for you.",
  n1: "And it's all one polished platform: a branded registration page with online payments, sessions, speakers and rooms, in person or virtual, certificates, a content library, and analytics.",
  n2a: "One, they show up. Automatic WhatsApp reminders, plus an AI that calls your no-shows. The room fills for real.",
  n2b: "Two, the door flies open. Priya scans her QR and she's in, your live count climbing on every screen.",
  n2c: "Three, the event never ends. Every guest is scored as they leave, so you walk out with your hottest leads, ranked.",
  n3: "The result? A packed room, a flawless day, and your best leads waiting the next morning, not two days lost in a spreadsheet.",
  n4: "EventSync. Registration is the easy part, we run the day. Book your free demo, and make your next event unforgettable.",
};
const ORDER = ['n0', 'n1', 'n2a', 'n2b', 'n2c', 'n3', 'n4'];

// ── 1. narration ──────────────────────────────────────────────────────────────
const SEP = ' ';
const fullText = ORDER.map((k) => NARR[k]).join(SEP);
const mp3Path = join(dir, 'teaser3-narration.mp3');
const alignPath = join(dir, 'teaser3-align.json');
let Taud;
if (process.env.FRESH_NARRATION !== '1' && existsSync(mp3Path) && existsSync(alignPath)) {
  const c = JSON.parse(readFileSync(alignPath, 'utf8'));
  if (c.text === fullText) {
    console.log('Reusing cached narration.');
    Taud = { duration: c.duration, joined: c.joined, starts: c.starts, ends: c.ends,
      timeAtChar: (i) => c.starts[Math.max(0, Math.min(i, c.starts.length - 1))] };
  }
}
if (!Taud) {
  console.log(`Synthesizing narration (${fullText.length} chars, 1.1x)...`);
  Taud = await synthTimed(fullText, mp3Path, { speed: 1.1 });
  writeFileSync(alignPath, JSON.stringify({ text: fullText, duration: Taud.duration, joined: Taud.joined, starts: Taud.starts, ends: Taud.ends }));
}
console.log(`Narration ${Taud.duration.toFixed(1)}s`);
if (Taud.duration > 78) throw new Error(`narration ballooned (${Taud.duration.toFixed(1)}s > 78s) — trim or re-take (FRESH_NARRATION=1)`);

let offset = 0;
const slots = {};
for (let i = 0; i < ORDER.length; i++) {
  const k = ORDER[i];
  const charStart = offset, charEnd = offset + NARR[k].length;
  const nextOffset = charEnd + SEP.length;
  const start = Taud.timeAtChar(charStart);
  const end = i < ORDER.length - 1 ? Taud.timeAtChar(nextOffset) : Taud.duration;
  offset = nextOffset;
  const localFind = (phrase) => { const j = Taud.joined.indexOf(phrase.toLowerCase(), charStart); return (j < 0 || j >= charEnd) ? null : Taud.starts[j]; };
  slots[k] = { start, duration: end - start, localFind };
}

// ── 2. PASS A — raw app clips (recorded once, reused by both orientations) ────
const RAW = [
  // capability sweep (fixed 4s each) — the "feature-rich, whole-platform" beat
  { name: 'r-cov-page', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/landing`, { waitUntil: 'networkidle' });
      await page.getByText(/Add Sections|About the Summit|Landing/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-register', account: ACCT.guest, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/events/product-summit-2026`, { waitUntil: 'networkidle' });
      await page.getByText(/Product Summit 2026/i).first().waitFor({ timeout: 25000 });
      await page.evaluate(() => { const el = document.querySelector('#full_name') || document.querySelector('form'); if (el) el.scrollIntoView({ block: 'center' }); }).catch(() => {});
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-sessions', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/sessions`, { waitUntil: 'networkidle' });
      await page.getByText(/Opening Keynote|Session/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-venue', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/new`, { waitUntil: 'networkidle' });
      await page.getByText(/Create Event/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      await page.locator('#title').fill('Innovation Summit 2027').catch(() => {});
      try {
        const fmt = page.getByRole('combobox').nth(1);
        await fmt.click(); await page.waitForTimeout(400);
        await page.getByRole('option', { name: /hybrid/i }).first().click(); await page.waitForTimeout(500);
      } catch {}
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-certs', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/certificates`, { waitUntil: 'networkidle' });
      await page.getByText(/Certificate/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-content', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/content`, { waitUntil: 'networkidle' });
      await page.getByText(/PRD Template|Pre-Read|Content/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  { name: 'r-cov-analytics', account: ACCT.admin, seconds: 4, beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/analytics`, { waitUntil: 'networkidle' });
      await page.getByText(/Analytics/i).first().waitFor({ timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(2500); // let ECharts draw before the camera opens
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  // proof 1 — the reminder loop (BEFORE): WhatsApp wave + AI calls, view-only
  { name: 'r-p1-reminders', account: ACCT.admin, slot: 'n2a', beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/reminders`, { waitUntil: 'networkidle' });
      await page.getByText(/Reminder Loop/i).first().waitFor({ timeout: 25000 });
      await page.getByText(/WhatsApp Reminders/i).first().waitFor({ timeout: 15000 }).catch(() => {});
      const anchor = page.getByText(/WhatsApp Reminders/i).first();
      await anchor.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
      await page.waitForTimeout(400);
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  // proof 2 — live check-in (DURING): attendance rate climbing, view-only
  { name: 'r-p2-checkin', account: ACCT.admin, slot: 'n2b', beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/check-in/${EVENT_ID}`, { waitUntil: 'networkidle' });
      await page.getByText(/Check-In/i).first().waitFor({ timeout: 25000 });
      await page.waitForFunction(() => /Attendance Rate/.test(document.body.innerText) && /\d{2,3}/.test(document.body.innerText), undefined, { timeout: 20000 }).catch(() => {});
      const anchor = page.getByText(/Attendance Rate/i).first();
      await anchor.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
      await page.waitForTimeout(400);
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
  // proof 3 — engagement scoring (AFTER): Priya Hot 92, tiers, view-only
  { name: 'r-p3-engagement', account: ACCT.admin, slot: 'n2c', beats: async ({ page, D, ready }) => {
      await page.goto(`${BASE}/admin/events/${EVENT_ID}/engagement`, { waitUntil: 'networkidle' });
      await page.getByText(/Engagement Scoring/i).first().waitFor({ timeout: 25000 });
      await page.getByText(/Priya Sharma/i).first().waitFor({ timeout: 15000 }).catch(() => {});
      const row = page.getByText(/Priya Sharma/i).first();
      await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
      await page.waitForTimeout(400);
      const waitUntil = await ready(400);
      await waitUntil(D);
    } },
];

for (const r of RAW) {
  const out = join(dir, `${r.name}-v.mp4`);
  const secs = r.slot ? slots[r.slot].duration : r.seconds;
  if (process.env.FRESH_VIDEO !== '1' && existsSync(out)) {
    try {
      const d = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', out]).toString().trim());
      if (isFinite(d) && Math.abs(d - (secs + (r.slot ? T_X : 0))) < 0.5) { console.log(`[${r.name}] reuse cached`); continue; }
    } catch {}
  }
  let ok = false, lastErr;
  for (let a = 0; a < 3 && !ok; a++) {
    try {
      await recordSceneVideo({
        scene: { name: r.name, account: r.account, beats: r.beats },
        slotStart: r.slot ? slots[r.slot].start : 0,
        slotDuration: secs,
        localFind: r.slot ? slots[r.slot].localFind : (() => null),
        tailT: r.slot ? T_X : 0,
      });
      ok = true;
    } catch (e) { lastErr = e; console.log(`[${r.name}] attempt ${a + 1} failed: ${e.message.split('\n')[0]}`); }
  }
  if (!ok) throw new Error(`raw clip ${r.name} failed: ${lastErr?.message}`);
}

const b64 = (name) => 'data:video/mp4;base64,' + readFileSync(join(dir, `${name}-v.mp4`)).toString('base64');

// ── 3. PASS B — canvas scenes per orientation ─────────────────────────────────
const CANVAS_BG = `background:
  radial-gradient(900px 500px at 15% -10%,rgba(45,212,191,.22),transparent 60%),
  radial-gradient(800px 500px at 95% 115%,rgba(139,92,246,.30),transparent 55%),
  linear-gradient(135deg,#06131a 0%,#0a2b30 52%,#0c1e3c 100%)`;

const baseCss = (o) => `
  *{margin:0;padding:0;box-sizing:border-box}html,body{height:100%}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#e9f2f0;overflow:hidden;${CANVAS_BG}}
  .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:${o === 'tall' ? '60px 44px 200px' : '56px'}}
  .logocard{background:#fff;border-radius:20px;padding:${o === 'tall' ? '20px 34px' : '16px 28px'};box-shadow:0 14px 40px rgba(0,0,0,.35)}
  .logocard img{height:${o === 'tall' ? 108 : 82}px;width:auto;display:block}
  .kicker{color:#2dd4bf;font-weight:800;font-size:${o === 'tall' ? 26 : 22}px;letter-spacing:2.5px;text-transform:uppercase}
  h1{font-weight:800;letter-spacing:-.02em;line-height:1.1;font-size:${o === 'tall' ? 66 : 64}px}
  h1 .g{color:#fbbf24}
  .sub{color:#9ecdcf;font-size:${o === 'tall' ? 30 : 26}px;line-height:1.45}
  .chip{display:inline-block;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.42);border-radius:999px;
    padding:${o === 'tall' ? '14px 30px' : '10px 24px'};font-size:${o === 'tall' ? 28 : 22}px;font-weight:700;color:#fde3a7}
  .frame{border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.14);
    width:${o === 'tall' ? '94%' : '76%'};position:relative;background:#06131a}
  .crop{overflow:hidden;width:100%;aspect-ratio:16/9}
  .crop video{display:block;width:100%;height:100%;object-fit:cover}
  .grid{display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden;text-align:left}
  .grid .l{font-size:${o === 'tall' ? 26 : 21}px;color:rgba(255,255,255,.55);padding:${o === 'tall' ? '18px 22px' : '14px 24px'};display:flex;align-items:center;justify-content:flex-end;text-align:right}
  .grid .r{font-size:${o === 'tall' ? 26 : 21}px;font-weight:600;color:#6ee7b7;padding:${o === 'tall' ? '18px 22px' : '14px 24px'};border-left:1px solid rgba(255,255,255,.15);display:flex;align-items:center}
  .cta{display:inline-block;background:linear-gradient(135deg,#0d9488,#7c3aed);color:#fff;font-weight:700;
    font-size:${o === 'tall' ? 34 : 28}px;padding:${o === 'tall' ? '24px 52px' : '18px 42px'};border-radius:999px;box-shadow:0 12px 30px rgba(13,148,136,.4)}
  .gap-s{margin-top:18px}.gap-m{margin-top:28px}.gap-l{margin-top:38px}
`;

const page5 = (o, inner, script = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss(o)}</style></head>
<body><div class="wrap">${inner}</div><script>${script}</script></body></html>`;

const LOGO_HTML = `<div class="logocard"><img src="${LOGO}"/></div>`;

function cardProblem(o) {
  return page5(o, `
    ${LOGO_HTML}
    <div class="kicker gap-l">EventSync &middot; Event Management Platform</div>
    <h1 class="gap-m">Registration is the easy part.<br><span class="g">EventSync runs the day.</span></h1>
    <div class="sub gap-m">A Google Form &middot; a WhatsApp group &middot; a printed list at the door</div>
    <div class="chip gap-m">40% who register never walk in &mdash; but you catered, seated and staffed for a full room</div>`);
}

function cardCoverage(o, perSec) {
  const labels = ['Page builder', 'Register & pay', 'Sessions & speakers', 'Venue & virtual', 'Certificates', 'Content library', 'Analytics'];
  const vids = ['r-cov-page', 'r-cov-register', 'r-cov-sessions', 'r-cov-venue', 'r-cov-certs', 'r-cov-content', 'r-cov-analytics']
    .map((n, i) => `<video muted playsinline preload="auto" src="${b64(n)}" style="position:absolute;inset:0;opacity:${i === 0 ? 1 : 0};transition:opacity .3s"></video>`)
    .join('');
  return page5(o, `
    <div class="kicker">One platform &middot; every part of the event</div>
    <div class="frame gap-m"><div class="crop" style="aspect-ratio:16/9;position:relative">${vids}</div></div>
    <div class="chip gap-m" id="lab">${labels[0]}</div>`, `
    window.__start = () => {
      const vids=[...document.querySelectorAll('video')], lab=document.getElementById('lab');
      const labels=${JSON.stringify(labels)};
      const show=(k)=>{vids.forEach((v,j)=>{v.style.opacity=j===k?1:0; if(j===k){try{v.currentTime=0;v.play();}catch(e){}}else{try{v.pause();}catch(e){}}}); lab.textContent=labels[k];};
      show(0); let i=0;
      const iv=setInterval(()=>{i++; if(i>=7){clearInterval(iv);return;} show(i);}, ${Math.max(1.0, perSec).toFixed(2)}*1000);
    };`);
}

// fx pans/zooms the proof window onto the panel being claimed
function cardProof(o, clipName, label, fx) {
  const f = (fx && fx[o]) || (o === 'tall' ? { s: 1.4, x: 0, y: 0 } : { s: 1, x: 0, y: 0 });
  const style = `transform:scale(${f.s}) translate(${f.x}%,${f.y}%)`;
  return page5(o, `
    <div class="chip">${label}</div>
    <div class="frame gap-m"><div class="crop"><video muted playsinline preload="auto" style="${style}" src="${b64(clipName)}"></video></div></div>`, `
    window.__start = () => { const v=document.querySelector('video'); try{v.play();}catch(e){} };`);
}

function cardNumbers(o) {
  return page5(o, `
    <div class="kicker">The math changes</div>
    <div class="grid gap-m">
      <div class="l">40% no-shows, plan blind</div><div class="r">Reminders + AI calls &mdash; the room you planned for</div>
      <div class="l">Printed lists, queues at the door</div><div class="r">QR check-in, live count on every phone</div>
      <div class="l">Two days of Excel after</div><div class="r">Every attendee scored &mdash; your leads, ranked</div>
    </div>
    <div class="sub gap-m" style="color:#e9f2f0;font-weight:600">No per-seat games &middot; priced to your event, quoted the same day</div>`);
}

function cardCta(o) {
  return page5(o, `
    ${LOGO_HTML}
    <h1 class="gap-l" style="font-size:${o === 'tall' ? 58 : 56}px">Registration is the easy part.<br><span class="g">We run the day.</span></h1>
    <div class="cta gap-l">Book a free demo &rarr;</div>
    <div class="sub gap-m" style="font-size:${o === 'tall' ? 24 : 20}px">event.in-sync.co.in &middot; part of the In-Sync suite</div>`);
}

async function recordCanvas({ name, html, seconds, vp }) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: vp, recordVideo: { dir, size: vp } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.querySelectorAll('video')].map((v) =>
    v.readyState >= 3 ? 1 : new Promise((res) => { v.addEventListener('canplaythrough', res, { once: true }); v.addEventListener('error', res, { once: true }); })
  ))).catch(() => {});
  await page.waitForTimeout(250);
  const leadSec = (Date.now() - t0) / 1000;
  await page.evaluate(() => window.__start && window.__start()).catch(() => {});
  await page.waitForTimeout(seconds * 1000);
  await ctx.close(); await browser.close();
  const webm = await page.video().path();
  const mp4 = join(dir, `${name}-v.mp4`);
  V.webmToMp4(webm, mp4, leadSec, seconds);
  console.log(`[${name}] canvas ${seconds.toFixed(2)}s`);
  return mp4;
}

const ORIENTS = [
  { key: 'wide', vp: { width: 1920, height: 1080 }, out: 'C:\\Users\\Admin\\Downloads\\eventsync-teaser.mp4', subStyle: "FontName=Segoe UI,FontSize=17,Bold=1,BorderStyle=1,Outline=2,Shadow=0,OutlineColour=&H96000000,PrimaryColour=&H00FFFFFF,MarginV=40" },
  // libass scales FontSize/margins by height/288 — portrait needs tiny values
  { key: 'tall', vp: { width: 1080, height: 1920 }, out: 'C:\\Users\\Admin\\Downloads\\eventsync-teaser-mobile.mp4', subStyle: "FontName=Segoe UI,FontSize=7,Bold=1,BorderStyle=1,Outline=1,Shadow=0,OutlineColour=&H96000000,PrimaryColour=&H00FFFFFF,MarginV=20" },
];

// sentence-level subtitle cues from the TTS timing (teasers get watched muted)
const srtTime = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
const cues = [];
let cursor = 0;
for (const k of ORDER) {
  for (const raw of NARR[k].split(/(?<=[.!?])\s+/)) {
    const line = raw.trim();
    if (!line) continue;
    const j = Taud.joined.indexOf(line.toLowerCase().slice(0, Math.min(24, line.length)), cursor);
    if (j < 0) continue;
    const start = Taud.timeAtChar(j);
    const end = Taud.timeAtChar(j + line.length - 1) + 0.25;
    cues.push(`${cues.length + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${line}\n`);
    cursor = j + line.length;
  }
}
writeFileSync(join(dir, 'teaser3-subs.srt'), cues.join('\n'), 'utf8');
console.log(`${cues.length} subtitle cues`);

for (const O of ORIENTS) {
  console.log(`\n=== ${O.key} (${O.vp.width}x${O.vp.height}) ===`);
  const covPer = slots.n1.duration / 7;
  const sceneDefs = [
    { k: 'n0', html: cardProblem(O.key) },
    { k: 'n1', html: cardCoverage(O.key, covPer) },
    { k: 'n2a', html: cardProof(O.key, 'r-p1-reminders', '1 &middot; They actually show up', { wide: { s: 1.15, x: 0, y: 0 }, tall: { s: 1.4, x: 0, y: 0 } }) },
    { k: 'n2b', html: cardProof(O.key, 'r-p2-checkin', "2 &middot; The door doesn't jam", { wide: { s: 1.2, x: 0, y: 0 }, tall: { s: 1.45, x: 0, y: 0 } }) },
    { k: 'n2c', html: cardProof(O.key, 'r-p3-engagement', '3 &middot; The event doesn&rsquo;t just end', { wide: { s: 1.2, x: 0, y: 0 }, tall: { s: 1.45, x: 0, y: 0 } }) },
    { k: 'n3', html: cardNumbers(O.key) },
    { k: 'n4', html: cardCta(O.key) },
  ];
  const clips = [];
  for (const sd of sceneDefs) {
    clips.push(await recordCanvas({ name: `c-${sd.k}-${O.key}`, html: sd.html, seconds: slots[sd.k].duration + T_X, vp: O.vp }));
  }
  const silent = join(dir, `teaser3-${O.key}-silent.mp4`);
  V.crossfadeStitchVideo(clips, silent, T_X);
  const narrated = join(dir, `teaser3-${O.key}-narrated.mp4`);
  V.overlayAudio(silent, mp3Path, narrated);
  execFileSync(FF, ['-y', '-i', `teaser3-${O.key}-narrated.mp4`,
    '-vf', `subtitles=teaser3-subs.srt:force_style='${O.subStyle}'`,
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', `teaser3-${O.key}-styled.mp4`], { cwd: dir });
  V.holdAndFade(join(dir, `teaser3-${O.key}-styled.mp4`), O.out, 2.0, 1.0);
  console.log('DONE ->', O.out);
}
