import type { Item } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "all";
  const cursor = url.searchParams.get("cursor");
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(30, Math.max(1, Number(limitRaw ?? "10") || 10));

  const where = category === "all" ? {} : { category };

  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const nextCursor = items.length === limit ? items[items.length - 1].id : null;

  return NextResponse.json({
    items: items.map((it: Item) => ({
      ...it,
      captions: (() => {
        try {
          return JSON.parse(it.captions);
        } catch {
          return [];
        }
      })(),
    })),
    nextCursor,
  });
}

