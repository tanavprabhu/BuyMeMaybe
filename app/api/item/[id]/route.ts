import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Deletes a public file path under /public if it exists, returning an error message on failure.
function safeDeletePublicPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl || !publicUrl.startsWith("/")) return null;
  const publicRoot = resolve(process.cwd(), "public");
  const abs = resolve(publicRoot, `.${publicUrl}`);
  if (!abs.startsWith(publicRoot)) return "Refusing to delete path outside /public.";
  if (!existsSync(abs)) return null;
  try {
    unlinkSync(abs);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Failed to delete ${publicUrl}: ${msg}`;
  }
}

// Deletes an item row and associated generated/uploaded files.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const errs = [safeDeletePublicPath(item.videoUrl), safeDeletePublicPath(item.imageUrl)].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    if (errs.length > 0) {
      return NextResponse.json(
        { error: "Could not remove listing files. Try again.", details: errs },
        { status: 500 },
      );
    }

    await prisma.item.delete({ where: { id } });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
