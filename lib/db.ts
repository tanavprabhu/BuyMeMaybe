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

function prismaProduction(): PrismaClient {
  return (globalForPrisma.prisma ??= new PrismaClient());
}

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
