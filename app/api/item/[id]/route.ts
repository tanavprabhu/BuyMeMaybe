import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { deleteStoredAsset } from "../../../../lib/storage";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const errs = (
      await Promise.all([deleteStoredAsset(item.videoUrl), deleteStoredAsset(item.imageUrl)])
    ).filter((x): x is string => typeof x === "string" && x.length > 0);
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
