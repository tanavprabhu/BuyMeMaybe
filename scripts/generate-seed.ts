import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db";
import { withDedalusMachineHooks } from "../lib/dedalus";
import { analyzeItem } from "../lib/gemini";
import { generateTalkingVideo } from "../lib/video";
import { makeFinalVideo } from "../lib/ffmpeg";
import { writeGeneratedVideo, writeUpload } from "../lib/storage";

function extToMime(ext: string): { mime: string; uploadExt: "jpg" | "png" | "webp" } {
  const e = ext.toLowerCase();
  if (e === ".png") return { mime: "image/png", uploadExt: "png" };
  if (e === ".webp") return { mime: "image/webp", uploadExt: "webp" };
  return { mime: "image/jpeg", uploadExt: "jpg" };
}

async function generateOne(imagePath: string): Promise<void> {
  const id = randomUUID();
  const ext = extname(imagePath);
  const { mime, uploadExt } = extToMime(ext);
  const imageBytes = readFileSync(imagePath);

  console.log(`\n→ [seed] ${imagePath}`);
  const analysis = await analyzeItem([{ bytes: imageBytes, mimeType: mime }]);

  const imageUrl = writeUpload({ id, bytes: imageBytes, ext: uploadExt });
  await withDedalusMachineHooks(`seed:${id}`, async () => {
    const rawVideo = await generateTalkingVideo({
      imageBytes,
      mimeType: mime,
      videoPrompt: analysis.videoPrompt,
      durationSec: 10,
    });
    const finalVideo = await makeFinalVideo({ rawVideoMp4: rawVideo });
    const videoUrl = writeGeneratedVideo({ id, bytes: finalVideo });

    await prisma.item.create({
      data: {
        id,
        itemName: analysis.itemName,
        category: analysis.category,
        script: analysis.script,
        videoUrl,
        imageUrl,
        askingPrice: analysis.askingPrice,
        originalPrice: analysis.originalPrice ?? undefined,
        urgencyDays: analysis.urgencyDays,
        sellerName: analysis.sellerName,
        sellerLocation: analysis.sellerLocation,
        listingLine1: null,
        listingLine2: null,
        listingExtra: null,
        sellerCategoryKey: null,
        captions: JSON.stringify(analysis.captions),
      },
    });
  });

  console.log(`✓ [seed] created item ${id}`);
}

async function main() {
  config({ path: ".env" });
  config({ path: ".env.local", override: true });
  const dir = "seed-photos";
  const files = readdirSync(dir).filter((f) =>
    [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase()),
  );
  if (files.length === 0) {
    throw new Error("No images found in seed-photos/. Add ~20 photos then re-run.");
  }

  console.log(`→ Generating ${files.length} seed items (sequential)`);
  for (const f of files) {
    await generateOne(join(dir, f));
  }
  console.log("\n✓ Seed generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

