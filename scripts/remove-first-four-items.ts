import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { deleteStoredAsset } from "../lib/storage";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
    select: { id: true, itemName: true, videoUrl: true, imageUrl: true },
  });
  if (rows.length === 0) {
    console.log("No items to remove.");
    return;
  }
  console.log(
    "Removing (oldest 4):",
    rows.map((r) => `${r.id.slice(0, 8)}… ${r.itemName}`).join(" | "),
  );
  for (const item of rows) {
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
