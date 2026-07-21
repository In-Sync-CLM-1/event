// Generates a rights-clean, upbeat "promo" music bed (our own composition).
//   node scripts/gen-music.mjs  ->  scripts/assets/promo-bed.wav (+ .mp3)
// Uplifting C-major pop/EDM: I–V–vi–IV, 124 BPM, with an intro→build→full→outro arc.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';

const SR = 44100;
const BPM = 124;
const beat = 60 / BPM;
const bar = beat * 4;
const BARS = 35;                 // ~68s (covers the full promo + tail)
const DUR = bar * BARS;
const N = Math.floor(DUR * SR);
const L = new Float64Array(N), R = new Float64Array(N);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// I–V–vi–IV in C: C, G, Am, F  (root + triad, one bar each, looped)
const PROG = [
  { root: 48, tri: [60, 64, 67] }, // C
  { root: 43, tri: [59, 62, 67] }, // G
  { root: 45, tri: [60, 64, 69] }, // Am
  { root: 41, tri: [60, 65, 69] }, // F
];

// section energy: intro(0-3) build(4-7) full(8-19) lift(20-23) full(24-27)
const energyAt = (b) => b < 4 ? 0.25 : b < 8 ? 0.55 : b < 20 ? 1 : b < 24 ? 0.7 : 1;
const drumsAt = (b) => b >= 4;                 // drums enter bar 5
const arpAt   = (b) => true;
const env = (t, a, d) => t < a ? t / a : Math.exp(-(t - a) / d);
const soft = (x) => Math.tanh(x);
// one-pole lowpass state per voice
function lp(cutoff) { let y = 0; const a = Math.min(0.999, cutoff); return (x) => (y += a * (x - y)); }

const add = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

// ── drums ──────────────────────────────────────────────────────────────────
for (let b = 0; b < BARS; b++) {
  if (!drumsAt(b)) continue;
  const e = energyAt(b);
  for (let step = 0; step < 16; step++) {           // 16th grid
    const t0 = b * bar + step * (beat / 4);
    const s0 = Math.floor(t0 * SR);
    // kick on every quarter
    if (step % 4 === 0) {
      for (let k = 0; k < SR * 0.32; k++) {
        const t = k / SR;
        const f = 120 * Math.exp(-t * 30) + 48;
        const a = Math.exp(-t * 8) * 0.9 * e;
        const s = Math.sin(2 * Math.PI * f * t) * a;
        add(s0 + k, s, s);
      }
    }
    // hat on offbeat 8ths + some 16ths when full
    if (step % 2 === 1 && (e > 0.9 || step % 4 === 3)) {
      for (let k = 0; k < SR * 0.05; k++) {
        const t = k / SR;
        const a = Math.exp(-t * 90) * 0.22 * e;
        const s = (Math.random() * 2 - 1) * a;
        add(s0 + k, s * 0.8, s);
      }
    }
    // clap/snare on beats 2 & 4 when full
    if ((step === 4 || step === 12) && e > 0.9) {
      for (let k = 0; k < SR * 0.12; k++) {
        const t = k / SR;
        const a = Math.exp(-t * 24) * 0.35;
        const s = (Math.random() * 2 - 1) * a;
        add(s0 + k, s, s * 0.85);
      }
    }
  }
}

// ── bass (root, rhythmic 8ths) ───────────────────────────────────────────────
for (let b = 0; b < BARS; b++) {
  if (b < 4) continue;
  const ch = PROG[b % 4];
  const e = energyAt(b);
  for (let ei = 0; ei < 8; ei++) {
    const t0 = b * bar + ei * (beat / 2);
    const s0 = Math.floor(t0 * SR);
    const f = mtof(ch.root);
    const len = SR * (beat / 2) * 0.9;
    for (let k = 0; k < len; k++) {
      const t = k / SR;
      const a = env(t, 0.006, 0.12) * 0.5 * e;
      // saw-ish
      const ph = (f * t) % 1;
      const s = (2 * ph - 1) * a;
      add(s0 + k, s, s);
    }
  }
}

// ── arp (triad up, 16ths) with filter opening over sections ──────────────────
for (let b = 0; b < BARS; b++) {
  const ch = PROG[b % 4];
  const e = energyAt(b);
  const cut = 0.03 + 0.12 * e;
  const flt = lp(cut);
  for (let step = 0; step < 16; step++) {
    const note = ch.tri[step % 3] + 12;            // up an octave
    const t0 = b * bar + step * (beat / 4);
    const s0 = Math.floor(t0 * SR);
    const f = mtof(note);
    const len = SR * (beat / 4) * 0.95;
    for (let k = 0; k < len; k++) {
      const t = k / SR;
      const a = env(t, 0.004, 0.05) * 0.16 * (0.5 + 0.5 * e);
      const ph = (f * t) % 1;
      const raw = (2 * ph - 1);
      const s = flt(raw) * a;
      const pan = (step % 3) / 3;                   // gentle spread
      add(s0 + k, s * (1 - pan * 0.4), s * (0.6 + pan * 0.4));
    }
  }
}

// ── pad (sustained triad, soft sines) ────────────────────────────────────────
for (let b = 0; b < BARS; b++) {
  const ch = PROG[b % 4];
  const e = energyAt(b);
  const s0 = Math.floor(b * bar * SR);
  const len = Math.floor(bar * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const a = env(t, 0.15, 3.0) * 0.10 * (0.6 + 0.4 * e);
    let s = 0;
    for (const m of ch.tri) s += Math.sin(2 * Math.PI * mtof(m) * t);
    s = (s / ch.tri.length) * a;
    add(s0 + k, s, s);
  }
}

// ── master: gentle bus compression feel + soft clip + normalize ──────────────
let peak = 0;
for (let i = 0; i < N; i++) { peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.9 / (peak || 1);
// global fade in (0.3s) + out (last 2.5s)
const fadeIn = 0.3 * SR, fadeOut = 2.5 * SR;
for (let i = 0; i < N; i++) {
  let fi = 1;
  if (i < fadeIn) fi = i / fadeIn;
  if (i > N - fadeOut) fi = Math.max(0, (N - i) / fadeOut);
  L[i] = soft(L[i] * g * 1.1) * fi;
  R[i] = soft(R[i] * g * 1.1) * fi;
}

// ── write 16-bit PCM WAV ─────────────────────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const wavPath = join(here, 'assets', 'promo-bed.wav');
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), o); o += 2;
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), o); o += 2;
}
writeFileSync(wavPath, buf);
console.log(`wrote ${wavPath} (${DUR.toFixed(1)}s)`);

// encode mp3 too
const mp3Path = join(here, 'assets', 'promo-bed.mp3');
execFileSync('C:\\Users\\Admin\\scoop\\shims\\ffmpeg.exe', ['-y', '-i', wavPath, '-b:a', '192k', mp3Path]);
console.log(`wrote ${mp3Path}`);
