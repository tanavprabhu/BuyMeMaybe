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
    throw new Error(
      "No image passed and seed-photos/ is empty. Usage: npx tsx scripts/test-analyze.ts <path> [more paths…]",
    );
  }
  return join("seed-photos", candidates[0]!);
}

function mimeForPath(imagePath: string): string {
  const ext = extname(imagePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

// Runs analyzeItem on one or more local images and pretty-prints the result.
async function main() {
  const args = process.argv.slice(2).filter(Boolean);
  const paths = args.length > 0 ? args : [resolveImagePath()];
  console.log(`\n→ Analyzing ${paths.length} image(s)\n`);
  const images = paths.map((imagePath) => ({
    bytes: readFileSync(imagePath),
    mimeType: mimeForPath(imagePath),
  }));
  const result = await analyzeItem(images);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
