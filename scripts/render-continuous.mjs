// Continuous-narration pipeline for Eventsync walkthrough.
// ONE Riya take for the whole script (0.95x speed), video per scene, crossfaded,
// audio overlaid underneath.
//   node scripts/render-continuous.mjs
//   SKIP_SEED=1 node scripts/render-continuous.mjs   (if data already seeded)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { SCENES } from './scenes.mjs';
import { initEventId } from './lib/app.mjs';
import { recordSceneVideo } from './lib/scene.mjs';
import { synthTimed } from './lib/voice.mjs';
import { crossfadeStitchVideo, overlayAudio, holdAndFade } from './lib/video.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir  = join(here, 'recordings', 'scenes');
mkdirSync(dir, { recursive: true });

const T_X = 0.5; // crossfade overlap in seconds

// 0. Seed live Supabase state
if (process.env.SKIP_SEED !== '1') {
  console.log('Seeding TechFest India / Product Summit 2026 demo state...');
  execFileSync(process.execPath, [join(here, 'seed-demo.mjs')], { stdio: 'inherit' });
}

// 0b. Resolve the seeded event UUID + first certificate number
console.log('Fetching EVENT_ID from Supabase...');
await initEventId();
console.log('EVENT_ID resolved. Building narration...');

// 1. Synthesize ONE continuous narration track with character timestamps
const SEP       = ' ';
const fullText  = SCENES.map(s => s.narration).join(SEP);
const audioOut  = join(dir, 'full-narration.mp3');
const timingOut = join(dir, 'full-narration.json');
let Taud;
if (process.env.SKIP_TTS === '1' && existsSync(audioOut) && existsSync(timingOut)) {
  console.log('Loading cached narration timing...');
  const t = JSON.parse(readFileSync(timingOut, 'utf8'));
  const joined = t.chars.join('').toLowerCase();
  Taud = { duration: t.ends[t.ends.length - 1], chars: t.chars, starts: t.starts, ends: t.ends, joined,
    timeAtChar: (i) => t.starts[Math.max(0, Math.min(i, t.starts.length - 1))] };
} else {
  console.log(`Synthesizing ${fullText.length} chars across ${SCENES.length} scenes...`);
  Taud = await synthTimed(fullText, audioOut, { speed: 0.95 });
  writeFileSync(timingOut, JSON.stringify({ chars: Taud.chars, starts: Taud.starts, ends: Taud.ends }));
}
console.log(`Narration: ${Taud.duration.toFixed(1)}s total`);

// 2. Map each scene to a time slot + a scoped word-finder
let offset = 0;
const slots = SCENES.map((s, i) => {
  const charStart = offset;
  const charEnd   = offset + s.narration.length;
  const start     = Taud.timeAtChar(charStart);
  const nextOff   = offset + s.narration.length + SEP.length;
  const end       = i < SCENES.length - 1 ? Taud.timeAtChar(nextOff) : Taud.duration;
  offset          = nextOff;
  // scoped find: returns absolute timestamp for first match in this scene's range
  const localFind = (phrase) => {
    const k = Taud.joined.indexOf(phrase.toLowerCase(), charStart);
    return (k < 0 || k >= charEnd) ? null : Taud.starts[k];
  };
  return { start, duration: end - start, localFind };
});

// 3. Record each scene (retry up to 3x for flaky logins or transient errors)
const videos = [];
for (let i = 0; i < SCENES.length; i++) {
  const scene = SCENES[i];
  const cachedMp4 = join(dir, `${scene.name}-v.mp4`);
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
  videos.push(v);
}

// 4. Crossfade-stitch video, overlay narration, add outro hold+fade
console.log('Crossfade-stitching scenes...');
const silent   = join(dir, 'continuous-silent.mp4');
crossfadeStitchVideo(videos, silent, T_X);

console.log('Overlaying narration audio...');
const narrated = join(dir, 'continuous-narrated.mp4');
overlayAudio(silent, audioOut, narrated);

const out = 'C:\\Users\\Admin\\Downloads\\event-demo-full.mp4';
console.log('Adding outro hold + fade to black...');
holdAndFade(narrated, out, 2.0, 1.2);
console.log('DONE ->', out);
