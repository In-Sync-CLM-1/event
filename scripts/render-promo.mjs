// EventSync PREMIUM PROMO — marketing cut (not the framed-window teaser).
//   node scripts/render-promo.mjs
// Motion bg + floating device mockups + kinetic type + count-ups + music bed.
// Landscape first (style validation); portrait added once the look is signed off.
import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';
import { synthTimed } from './lib/voice.mjs';
import * as V from './lib/video.mjs';

const FF = 'C:\\Users\\Admin\\scoop\\shims\\ffmpeg.exe';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'recordings', 'scenes');
const T_X = 0.35;
const IMG = (k) => 'data:image/png;base64,' + readFileSync(join(here, 'assets', 'promo', `${k}.png`)).toString('base64');
const LOGO = 'data:image/png;base64,' + readFileSync(join(here, 'assets', 'insync-logo-band.png')).toString('base64');
const MUSIC = join(here, 'assets', 'promo-bed.mp3');

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

// ── narration ─────────────────────────────────────────────────────────────────
const SEP = ' ';
const fullText = ORDER.map((k) => NARR[k]).join(SEP);
const mp3Path = join(dir, 'promo-narration.mp3');
const alignPath = join(dir, 'promo-align.json');
let Taud;
if (process.env.FRESH_NARRATION !== '1' && existsSync(mp3Path) && existsSync(alignPath)) {
  const c = JSON.parse(readFileSync(alignPath, 'utf8'));
  if (c.text === fullText) { console.log('Reusing narration.'); Taud = { duration: c.duration, timeAtChar: (i) => c.starts[Math.max(0, Math.min(i, c.starts.length - 1))], starts: c.starts }; }
}
if (!Taud) {
  console.log(`Synthesizing narration (${fullText.length} chars, 1.1x)...`);
  Taud = await synthTimed(fullText, mp3Path, { speed: 1.1 });
  writeFileSync(alignPath, JSON.stringify({ text: fullText, duration: Taud.duration, joined: Taud.joined, starts: Taud.starts, ends: Taud.ends }));
}
console.log(`Narration ${Taud.duration.toFixed(1)}s`);
let offset = 0; const slots = {};
for (let i = 0; i < ORDER.length; i++) {
  const k = ORDER[i]; const cS = offset, cE = offset + NARR[k].length; const nO = cE + SEP.length;
  const start = Taud.timeAtChar(cS); const end = i < ORDER.length - 1 ? Taud.timeAtChar(nO) : Taud.duration;
  offset = nO; slots[k] = { start, duration: end - start };
}

// ── shared premium shell (motion bg + kinetic helpers) ───────────────────────
const words = (str, base = 0, step = 0.075, cls = 'kw') =>
  str.split(' ').map((w, i) => `<span class="${cls}" style="animation-delay:${(base + i * step).toFixed(2)}s">${w}&nbsp;</span>`).join('');

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;font-family:'Segoe UI',Arial,sans-serif;color:#fff;overflow:hidden}
.stage{position:absolute;inset:0;background:linear-gradient(135deg,#080a1e 0%,#0f1030 45%,#1a0f2e 100%)}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;mix-blend-mode:screen}
.orb.a{width:760px;height:760px;background:#14b8a6;left:-180px;top:-220px;animation:orb 15s ease-in-out infinite}
.orb.b{width:680px;height:680px;background:#8b5cf6;right:-180px;bottom:-200px;animation:orb 17s ease-in-out infinite reverse}
.orb.c{width:560px;height:560px;background:#ec4899;left:38%;top:34%;animation:orb 19s ease-in-out infinite}
.sheen{position:absolute;top:-25%;left:-30%;width:36%;height:150%;transform:rotate(12deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);animation:sheen 8s linear infinite}
.vign{position:absolute;inset:0;box-shadow:inset 0 0 340px rgba(0,0,0,.65);pointer-events:none}
.wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 8%}
@keyframes orb{0%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,-36px) scale(1.14)}100%{transform:translate(0,0) scale(1)}}
@keyframes sheen{0%{transform:translateX(-40%) rotate(12deg)}100%{transform:translateX(360%) rotate(12deg)}}
@keyframes riseIn{from{opacity:0;transform:translateY(46px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.55)}62%{opacity:1;transform:scale(1.09)}100%{transform:scale(1)}}
@keyframes floaty{0%,100%{transform:perspective(1700px) rotateY(-13deg) rotateX(4deg) translateY(0)}50%{transform:perspective(1700px) rotateY(-13deg) rotateX(4deg) translateY(-16px)}}
@keyframes floatyR{0%,100%{transform:perspective(1700px) rotateY(13deg) rotateX(4deg) translateY(0)}50%{transform:perspective(1700px) rotateY(13deg) rotateX(4deg) translateY(-16px)}}
@keyframes floatC{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.kw{display:inline-block;opacity:0;animation:riseIn .72s cubic-bezier(.2,.85,.25,1) forwards}
.kline{display:inline-block;opacity:0;animation:riseIn .78s cubic-bezier(.2,.85,.25,1) forwards}
.acc{background:linear-gradient(90deg,#2dd4bf 0%,#a78bfa 50%,#f472b6 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.eyebrow{font-size:26px;font-weight:800;letter-spacing:6px;color:#8ee6d8;text-transform:uppercase;opacity:0;animation:riseIn .7s .05s forwards}
.h1{font-size:118px;font-weight:900;line-height:1.02;letter-spacing:-2px}
.h2{font-size:78px;font-weight:900;line-height:1.05;letter-spacing:-1px}
.sub{font-size:40px;font-weight:600;color:rgba(255,255,255,.72)}
.chip{display:inline-block;padding:14px 30px;border-radius:999px;font-size:30px;font-weight:800;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(6px)}
.chip.g{background:linear-gradient(90deg,rgba(45,212,191,.22),rgba(139,92,246,.22));border-color:rgba(139,92,246,.5);color:#dbeafe}
.device{border-radius:16px;overflow:hidden;background:#0b0b18;border:1px solid rgba(255,255,255,.12);box-shadow:0 50px 130px rgba(0,0,0,.65),0 0 90px rgba(139,92,246,.28)}
.device .bar{height:40px;background:#15162b;display:flex;align-items:center;gap:9px;padding:0 16px}
.device .dot{width:12px;height:12px;border-radius:50%}
.device .url{margin-left:14px;height:20px;flex:1;max-width:340px;background:rgba(255,255,255,.09);border-radius:10px}
.device .screen{position:relative;width:100%;aspect-ratio:1600/1000;overflow:hidden;background:#0b0b18}
.device .screen img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;transition:opacity .35s}
.floatL{animation:floaty 6s ease-in-out infinite}
.floatR{animation:floatyR 6s ease-in-out infinite}
.hidden{opacity:0}
.show{opacity:1;transition:opacity .5s,transform .6s cubic-bezier(.2,.85,.25,1)}
.up{transform:translateY(40px)}
.cta{display:inline-block;background:linear-gradient(90deg,#14b8a6,#8b5cf6);color:#fff;font-weight:800;font-size:40px;padding:26px 64px;border-radius:999px;box-shadow:0 18px 50px rgba(139,92,246,.5)}
.logocard{background:#fff;border-radius:22px;padding:20px 36px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.logocard img{height:92px;display:block}
`;

const BG = `<div class="stage"><div class="orb a"></div><div class="orb b"></div><div class="orb c"></div><div class="sheen"></div><div class="vign"></div></div>`;
const shell = (inner, script = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${BG}<div class="wrap">${inner}</div><script>${script}</script></body></html>`;
const deviceHTML = (screens, side = 'L', w = '58%') => `
  <div class="device float${side}" style="width:${w}">
    <div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span class="url"></span></div>
    <div class="screen">${screens.map((k, i) => `<img src="${IMG(k)}" style="opacity:${i === 0 ? 1 : 0}"/>`).join('')}</div>
  </div>`;

// stage-timeline helper: reveal .stg-N elements at times[] (seconds)
const timeline = (times) => `window.__start=()=>{const T=${JSON.stringify(times)};T.forEach((t,i)=>{setTimeout(()=>{const el=document.querySelector('.stg-'+i);if(el){el.classList.add('show');el.classList.remove('up');}},t*1000);});};`;

// ── scenes ────────────────────────────────────────────────────────────────────
function sceneHook(d) {
  return shell(`
    <div style="text-align:center;max-width:1400px">
      <div class="eyebrow">EventSync</div>
      <div class="h1" style="margin-top:26px">${words('Your event is your', .35)}<br><span class="acc kline" style="animation-delay:.95s">big moment.</span></div>
      <div class="stg-0 hidden up sub" style="margin-top:44px">A form. A group chat. A list at the door?</div>
      <div class="stg-1 hidden up" style="margin-top:40px"><span style="font-size:150px;font-weight:900;line-height:1" class="acc"><span id="num">0</span>%</span> <span class="sub" style="font-weight:800;color:#fff">never show up.</span></div>
    </div>`,
    `${timeline([d * 0.30, d * 0.55])}
     const _s=window.__start; window.__start=()=>{_s();
       setTimeout(()=>{let n=0;const t=setInterval(()=>{n+=2;if(n>=40){n=40;clearInterval(t);}document.getElementById('num').textContent=n;},26);}, ${d * 0.55}*1000+200);
     };`);
}

function sceneSweep(d) {
  const keys = ['page', 'register', 'sessions', 'venue', 'certs', 'content', 'analytics'];
  const labels = ['Event page builder', 'Registration & payments', 'Sessions & speakers', 'Venue & virtual rooms', 'Certificates', 'Content library', 'Analytics'];
  return shell(`
    <div style="width:100%;display:flex;flex-direction:column;align-items:center">
      <div class="h2" style="text-align:center">${words('One platform.', .2)}<span class="acc">${words(' Every part of your event.', .5)}</span></div>
      <div style="margin-top:40px">${deviceHTML(keys, 'C', '66%')}</div>
      <div class="chip g" id="lab" style="margin-top:36px;opacity:0;animation:popIn .6s .8s forwards">${labels[0]}</div>
    </div>`,
    `window.__start=()=>{const imgs=[...document.querySelectorAll('.screen img')],lab=document.getElementById('lab');const L=${JSON.stringify(labels)};let i=0;const per=${(d / keys.length).toFixed(2)};const show=k=>{imgs.forEach((im,j)=>im.style.opacity=j===k?1:0);lab.textContent=L[k];lab.style.animation='none';lab.offsetHeight;lab.style.animation='popIn .5s forwards';};show(0);const iv=setInterval(()=>{i++;if(i>=imgs.length){clearInterval(iv);return;}show(i);},per*1000);};
     document.querySelector('.device').style.animation='floatC 6s ease-in-out infinite';`);
}

function scenePower(d, { n, title, chip, key, side }) {
  const textBlock = `
    <div style="flex:1;${side === 'R' ? 'padding-right:5%' : 'padding-left:5%'}">
      <div class="eyebrow" style="color:#a78bfa">${n}</div>
      <div class="h2" style="margin-top:22px">${words(title, .25)}</div>
      <div class="chip g stg-0 hidden up" style="margin-top:38px">${chip}</div>
    </div>`;
  const dev = `<div style="flex:1.15;display:flex;justify-content:center">${deviceHTML([key], side, '96%')}</div>`;
  const inner = side === 'R'
    ? `<div style="display:flex;align-items:center;width:100%;gap:3%">${dev}${textBlock}</div>`
    : `<div style="display:flex;align-items:center;width:100%;gap:3%">${textBlock}${dev}</div>`;
  return shell(inner, timeline([d * 0.4]));
}

function sceneOutcome(d) {
  return shell(`
    <div style="text-align:center">
      <div class="eyebrow" style="color:#f472b6">The result</div>
      <div class="h1" style="font-size:96px;margin-top:30px;line-height:1.1">
        <div class="stg-0 hidden up show">A packed room.</div>
        <div class="stg-1 hidden up acc">A flawless day.</div>
        <div class="stg-2 hidden up show">Your best leads, ready.</div>
      </div>
    </div>`,
    timeline([d * 0.12, d * 0.42, d * 0.72]));
}

function sceneCta(d) {
  return shell(`
    <div style="text-align:center">
      <div class="logocard" style="display:inline-block;animation:popIn .7s forwards"><img src="${LOGO}"/></div>
      <div class="h2" style="margin-top:44px">${words('Registration is the easy part.', .3)}<br><span class="acc">${words('We run the day.', .8)}</span></div>
      <div class="stg-0 hidden up show" style="margin-top:48px"><span class="cta">Book your free demo &rarr;</span></div>
      <div class="stg-1 hidden up show sub" style="font-size:28px;margin-top:30px">event.in-sync.co.in &middot; part of the In-Sync suite</div>
    </div>`,
    timeline([d * 0.45, d * 0.62]));
}

// ── record + assemble ─────────────────────────────────────────────────────────
async function recordCanvas(name, html, seconds, vp) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: vp, recordVideo: { dir, size: vp } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; })))).catch(() => {});
  await page.waitForTimeout(250);
  const lead = (Date.now() - t0) / 1000;
  await page.evaluate(() => window.__start && window.__start()).catch(() => {});
  await page.waitForTimeout(seconds * 1000);
  await ctx.close(); await browser.close();
  const webm = await page.video().path();
  const mp4 = join(dir, `${name}-v.mp4`);
  V.webmToMp4(webm, mp4, lead, seconds);
  console.log(`[${name}] ${seconds.toFixed(2)}s`);
  return mp4;
}

function musicMix(silent, narr, music, out, dur) {
  execFileSync(FF, ['-y', '-i', silent, '-i', narr, '-stream_loop', '-1', '-i', music,
    '-filter_complex',
    `[2:a]volume=0.30,atrim=0:${(dur + 3).toFixed(2)}[mus];[mus][1:a]sidechaincompress=threshold=0.045:ratio=9:attack=12:release=340[md];[1:a][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', out]);
}

const ORIENTS = [
  { key: 'wide', vp: { width: 1920, height: 1080 }, out: 'C:\\Users\\Admin\\Downloads\\eventsync-promo.mp4' },
];

for (const O of ORIENTS) {
  console.log(`\n=== ${O.key} ===`);
  const S = (k, html) => recordCanvas(`p-${k}-${O.key}`, html, slots[k].duration + T_X, O.vp);
  const clips = [];
  clips.push(await S('n0', sceneHook(slots.n0.duration)));
  clips.push(await S('n1', sceneSweep(slots.n1.duration)));
  clips.push(await S('n2a', scenePower(slots.n2a.duration, { n: 'One', title: 'They show up.', chip: 'WhatsApp reminders + A.I. no-show calls', key: 'reminders', side: 'R' })));
  clips.push(await S('n2b', scenePower(slots.n2b.duration, { n: 'Two', title: 'The door flies open.', chip: 'QR check-in &middot; live count on every screen', key: 'checkin', side: 'L' })));
  clips.push(await S('n2c', scenePower(slots.n2c.duration, { n: 'Three', title: 'Your hottest leads, ranked.', chip: 'Every guest scored &middot; Hot &rarr; Passive', key: 'engagement', side: 'R' })));
  clips.push(await S('n3', sceneOutcome(slots.n3.duration)));
  clips.push(await S('n4', sceneCta(slots.n4.duration)));

  const silent = join(dir, `promo-${O.key}-silent.mp4`);
  V.crossfadeStitchVideo(clips, silent, T_X);
  const mixed = join(dir, `promo-${O.key}-mixed.mp4`);
  musicMix(silent, mp3Path, MUSIC, mixed, V.duration(silent));
  V.holdAndFade(mixed, O.out, 1.6, 1.2);
  console.log('DONE ->', O.out);
}
