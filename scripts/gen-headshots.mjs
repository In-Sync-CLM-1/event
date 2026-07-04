// Generates AI headshots for the four demo speakers via Gemini image generation.
// Writes scripts/assets/speakers/<key>.png (then seed-demo embeds them as data URIs).
// Usage: GEMINI_API_KEY=... node scripts/gen-headshots.mjs
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'assets', 'speakers');
mkdirSync(outDir, { recursive: true });

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY missing');

const MODELS = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];

const SPEAKERS = [
  { key: 'shreya',  prompt: 'Professional corporate headshot photograph of an Indian woman in her late 30s, chief product officer, confident warm smile, straight shoulder-length black hair, wearing a dark blazer over a cream top, soft studio lighting, plain light-grey background, sharp focus, 4k, photorealistic' },
  { key: 'karan',   prompt: 'Professional corporate headshot photograph of an Indian man in his early 40s, technology co-founder, friendly confident expression, short black hair, trimmed beard, wearing a navy blazer over a white shirt without tie, soft studio lighting, plain light-grey background, sharp focus, 4k, photorealistic' },
  { key: 'nandini', prompt: 'Professional corporate headshot photograph of an Indian woman in her mid 40s, chief design officer, poised elegant expression, black hair in a low bun, wearing a deep-teal silk blouse and subtle earrings, soft studio lighting, plain light-grey background, sharp focus, 4k, photorealistic' },
  { key: 'aarav',   prompt: 'Professional corporate headshot photograph of an Indian man in his mid 30s, chief revenue officer, energetic approachable smile, short styled black hair, clean shaven, wearing a charcoal suit jacket over a light-blue shirt, soft studio lighting, plain light-grey background, sharp focus, 4k, photorealistic' },
];

async function generate(model, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    },
  );
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  const parts = j?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error(`${model}: no image in response`);
  return Buffer.from(img.inlineData.data, 'base64');
}

for (const s of SPEAKERS) {
  const out = join(outDir, `${s.key}.png`);
  if (existsSync(out) && process.env.FORCE !== '1') { console.log(`skip ${s.key} (exists)`); continue; }
  let done = false, lastErr;
  for (const model of MODELS) {
    try {
      const buf = await generate(model, s.prompt);
      writeFileSync(out, buf);
      console.log(`${s.key}: ${buf.length} bytes via ${model}`);
      done = true;
      break;
    } catch (e) { lastErr = e; console.log(`  ${s.key} failed on ${model}: ${e.message.slice(0, 120)}`); }
  }
  if (!done) throw lastErr;
}
console.log('All headshots generated.');
