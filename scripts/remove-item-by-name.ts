import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { deleteStoredAsset } from "../lib/storage";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

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
    await deleteStoredAsset(item.videoUrl);
    await deleteStoredAsset(item.imageUrl);
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
