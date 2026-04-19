import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

function safeDeletePublicPath(publicUrl: string | null | undefined): void {
  if (!publicUrl || !publicUrl.startsWith("/")) return;
  const publicRoot = resolve(process.cwd(), "public");
  const abs = resolve(publicRoot, `.${publicUrl}`);
  if (!abs.startsWith(publicRoot)) return;
  if (!existsSync(abs)) return;
  try {
    unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

async function main() {
  const needle = process.argv.slice(2).join(" ").trim();
  if (!needle) {
    console.error('Usage: npx tsx scripts/remove-item-by-name.ts "Exact or partial item name"');
    process.exit(1);
  }

  const matches = await prisma.item.findMany({
    where: { itemName: { contains: needle } },
    select: { id: true, itemName: true, videoUrl: true, imageUrl: true },
  });

  if (matches.length === 0) {
    console.log(`No item matching: ${needle}`);
    return;
  }

  if (matches.length > 1) {
    console.log(`Multiple matches (${matches.length}), deleting all:`);
    for (const m of matches) console.log(`  - ${m.itemName} (${m.id})`);
  } else {
    console.log(`Removing: ${matches[0]!.itemName} (${matches[0]!.id})`);
  }

  for (const item of matches) {
    safeDeletePublicPath(item.videoUrl);
    safeDeletePublicPath(item.imageUrl);
    await prisma.item.delete({ where: { id: item.id } });
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
