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
