import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, basename } from "node:path";
import { config } from "dotenv";
import { generateTalkingVideo } from "../lib/video";

// Loads .env.local so XAI_API_KEY is available at runtime.
config({ path: ".env.local" });

const DEFAULT_PROMPT =
  "Photorealistic 9:16 vertical video. Preserve the exact item, lighting, texture, and background from the input image. Add a very subtle, semi-transparent cartoon face to the item — two small dot eyes and a soft simple mouth — blended onto its front surface like a light overlay, not 3D. Minimal motion: soft blinking every few seconds, tiny mouth movement as if speaking, a gentle micro-tilt. Do NOT turn it into a cartoon, add limbs, or change the background. 12 seconds.";

// Resolves the image path from CLI args or falls back to the first image in seed-photos/.
function resolveImagePath(): string {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  const candidates = readdirSync("seed-photos").filter((f) =>
    [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()),
  );
  if (candidates.length === 0) {
    throw new Error("Usage: npx tsx scripts/test-video.ts <image> [prompt]");
  }
  return join("seed-photos", candidates[0]);
}

// Runs one Grok Imagine video job end-to-end and writes the mp4 to tmp/.
async function main() {
  const imagePath = resolveImagePath();
  const prompt = process.argv[3] ?? DEFAULT_PROMPT;
  const ext = extname(imagePath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    "image/jpeg";
  console.log(`\n→ Generating video from ${imagePath} (${mime})\n`);
  const bytes = readFileSync(imagePath);
  const mp4 = await generateTalkingVideo({ imageBytes: bytes, mimeType: mime, videoPrompt: prompt });
  const out = `tmp/${basename(imagePath, ext)}.mp4`;
  writeFileSync(out, mp4);
  console.log(`\n✓ Wrote ${out} — open in QuickTime to check vibe.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
