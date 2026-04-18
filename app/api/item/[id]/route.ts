import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Deletes a public file path under /public if it exists.
function safeDeletePublicPath(publicUrl: string | null | undefined): void {
  if (!publicUrl || !publicUrl.startsWith("/")) return;
  const publicRoot = resolve(process.cwd(), "public");
  const abs = resolve(publicRoot, `.${publicUrl}`);
  if (!abs.startsWith(publicRoot)) return;
  if (existsSync(abs)) unlinkSync(abs);
}

// Deletes an item row and associated generated/uploaded files.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.item.delete({ where: { id } });
    safeDeletePublicPath(item.videoUrl);
    safeDeletePublicPath(item.imageUrl);

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
