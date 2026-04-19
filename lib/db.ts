import { statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function generatedClientMtime(): number {
  try {
    return statSync(join(process.cwd(), "node_modules", ".prisma", "client", "index.js")).mtimeMs;
  } catch {
    return 0;
  }
}

// Production: one PrismaClient on globalThis (standard Next.js pattern).
function prismaProduction(): PrismaClient {
  return (globalForPrisma.prisma ??= new PrismaClient());
}

// Development: after `prisma generate`, the bundled client updates on disk but a cached PrismaClient
// still has the old datamodel — causing "Unknown argument `listingLine1`". Recreate when the
// generated client file changes (mtime), so a dev restart is not always required.
let devPrisma: PrismaClient | undefined;
let devPrismaGenMtime = 0;

function prismaDevelopment(): PrismaClient {
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

// Proxy keeps `import { prisma } from "./db"` stable while delegating to the current client in dev.
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
