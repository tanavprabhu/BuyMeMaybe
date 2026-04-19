import { statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function assertPostgresDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw || (!raw.startsWith("postgresql://") && !raw.startsWith("postgres://"))) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL connection string (postgresql://…). " +
        "On Vercel: Project → Settings → Environment Variables → add DATABASE_URL for Production (and Preview if you use it), " +
        "paste the URL from Neon or Supabase, save, then Redeploy. Local .env files are not uploaded to Vercel.",
    );
  }

  if (process.env.VERCEL === "1") {
    const h = raw.toLowerCase();
    const pointsAtLoopback =
      h.includes("@localhost") ||
      h.includes("@127.0.0.1") ||
      h.includes("://localhost") ||
      h.includes("://127.0.0.1");
    if (pointsAtLoopback) {
      throw new Error(
        "DATABASE_URL points at localhost, which cannot work on Vercel: the database must live on the internet (Neon, Supabase, etc.), not on your PC. " +
          "In Vercel → Settings → Environment Variables, replace DATABASE_URL with your host’s postgresql://… string (from Neon dashboard → Connection string), save, then Redeploy. " +
          "Run `npx prisma migrate deploy` once against that same URL from your machine so tables exist.",
      );
    }
  }
}

function generatedClientMtime(): number {
  try {
    return statSync(join(process.cwd(), "node_modules", ".prisma", "client", "index.js")).mtimeMs;
  } catch {
    return 0;
  }
}

function prismaProduction(): PrismaClient {
  assertPostgresDatabaseUrl();
  return (globalForPrisma.prisma ??= new PrismaClient());
}

let devPrisma: PrismaClient | undefined;
let devPrismaGenMtime = 0;

function prismaDevelopment(): PrismaClient {
  assertPostgresDatabaseUrl();
  const m = generatedClientMtime();
  if (!devPrisma || m !== devPrismaGenMtime) {
    void devPrisma?.$disconnect().catch(() => {});
    devPrisma = new PrismaClient();
    devPrismaGenMtime = m;
  }
  return devPrisma;
}

function resolvePrisma(): PrismaClient {
  return process.env.NODE_ENV === "production" ? prismaProduction() : prismaDevelopment();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = resolvePrisma();
    const value = Reflect.get(real as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...a: unknown[]) => unknown).bind(real);
    }
    return value;
  },
}) as PrismaClient;
