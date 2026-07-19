// 60-second teaser pipeline — same continuous-narration method as the full
// walkthrough, separate scene set and output. Uses the CURRENT seeded demo
// state (does not reseed).
//   node scripts/render-teaser.mjs
//   SKIP_TTS=1 node scripts/render-teaser.mjs   (reuse cached narration take)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { TEASER_SCENES } from './teaser.mjs';
import { initEventId } from './lib/app.mjs';
import { recordSceneVideo } from './lib/scene.mjs';
import { synthTimed } from './lib/voice.mjs';
import { crossfadeStitchVideo, overlayAudio, holdAndFade } from './lib/video.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir  = join(here, 'recordings', 'teaser');
mkdirSync(dir, { recursive: true });

const T_X = 0.5;

console.log('Fetching EVENT_ID from Supabase...');
await initEventId();

const SEP       = ' ';
const fullText  = TEASER_SCENES.map(s => s.narration).join(SEP);
const audioOut  = join(dir, 'teaser-narration.mp3');
const timingOut = join(dir, 'teaser-narration.json');
let Taud;
if (process.env.SKIP_TTS === '1' && existsSync(audioOut) && existsSync(timingOut)) {
  console.log('Loading cached teaser narration...');
  const t = JSON.parse(readFileSync(timingOut, 'utf8'));
  const joined = t.chars.join('').toLowerCase();
  Taud = { duration: t.ends[t.ends.length - 1], chars: t.chars, starts: t.starts, ends: t.ends, joined,
    timeAtChar: (i) => t.starts[Math.max(0, Math.min(i, t.starts.length - 1))] };
} else {
  console.log(`Synthesizing teaser narration (${fullText.length} chars)...`);
  Taud = await synthTimed(fullText, audioOut, { speed: 1.0 }); // snappier than the walkthrough
  writeFileSync(timingOut, JSON.stringify({ chars: Taud.chars, starts: Taud.starts, ends: Taud.ends }));
}
console.log(`Narration: ${Taud.duration.toFixed(1)}s total`);

let offset = 0;
const slots = TEASER_SCENES.map((s, i) => {
  const charStart = offset;
  const charEnd   = offset + s.narration.length;
  const start     = Taud.timeAtChar(charStart);
  const nextOff   = offset + s.narration.length + SEP.length;
  const end       = i < TEASER_SCENES.length - 1 ? Taud.timeAtChar(nextOff) : Taud.duration;
  offset          = nextOff;
  const localFind = (phrase) => {
    const k = Taud.joined.indexOf(phrase.toLowerCase(), charStart);
    return (k < 0 || k >= charEnd) ? null : Taud.starts[k];
  };
  return { start, duration: end - start, localFind };
});

const videos = [];
for (let i = 0; i < TEASER_SCENES.length; i++) {
  const scene = TEASER_SCENES[i];
  // recordSceneVideo writes into recordings/scenes — cache lives there
  const cachedMp4 = join(here, 'recordings', 'scenes', `${scene.name}-v.mp4`);
  if (process.env.SKIP_TTS === '1' && existsSync(cachedMp4)) {
    console.log(`[${scene.name}] using cached video`);
    videos.push(cachedMp4);
    continue;
  }
  let v, lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      v = await recordSceneVideo({
        scene,
        slotStart:    slots[i].start,
        slotDuration: slots[i].duration,
        localFind:    slots[i].localFind,
        tailT:        T_X,
      });
      break;
    } catch (e) {
      lastErr = e;
      console.log(`[${scene.name}] attempt ${attempt + 1} failed: ${e.message.split('\n')[0]}`);
    }
  }
  if (!v) throw new Error(`Scene ${scene.name} failed after 3 attempts: ${lastErr?.message}`);
  // recordSceneVideo writes to recordings/scenes — move teaser takes to our dir
  videos.push(v);
}

console.log('Crossfade-stitching teaser...');
const silent   = join(dir, 'teaser-silent.mp4');
crossfadeStitchVideo(videos, silent, T_X);

console.log('Overlaying narration...');
const narrated = join(dir, 'teaser-narrated.mp4');
overlayAudio(silent, audioOut, narrated);

const out = 'C:\\Users\\Admin\\Downloads\\event-demo-teaser.mp4';
console.log('Adding outro hold + fade...');
holdAndFade(narrated, out, 1.5, 1.0);
console.log('DONE ->', out);
