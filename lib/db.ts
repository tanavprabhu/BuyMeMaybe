import { PrismaClient } from "@prisma/client";

// Holds a single Prisma client instance across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Returns the shared Prisma client, creating it on first use and reusing it on hot reload.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
