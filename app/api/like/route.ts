import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.item.update({
    where: { id: body.id },
    data: { likes: { increment: 1 } },
    select: { id: true, likes: true },
  });

  return NextResponse.json(updated);
}

