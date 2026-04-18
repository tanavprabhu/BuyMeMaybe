import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { config } from "dotenv";
import { analyzeItem } from "../lib/gemini";

config({ path: ".env" });
config({ path: ".env.local", override: true });

// Resolves the image path from CLI args or falls back to the first image in seed-photos/.
function resolveImagePath(): string {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  const candidates = readdirSync("seed-photos").filter((f) =>
    [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()),
  );
  if (candidates.length === 0) {
    throw new Error("No image passed and seed-photos/ is empty. Usage: npx tsx scripts/test-analyze.ts <path-to-image>");
  }
  return join("seed-photos", candidates[0]);
}

// Runs analyzeItem on a local image and pretty-prints the result.
async function main() {
  const imagePath = resolveImagePath();
  const ext = extname(imagePath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    "image/jpeg";
  console.log(`\n→ Analyzing ${imagePath} (${mime})\n`);
  const bytes = readFileSync(imagePath);
  const result = await analyzeItem(bytes, mime);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
