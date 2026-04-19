import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { ItemAnalysis } from "./gemini";
import type { SellerListingSpecs } from "./seller-specs";

export type JobListingImage = { url: string; mimeType: string; bytes?: Buffer };

export type JobState =
  | {
      status: "ready-to-generate";
      analysis: ItemAnalysis;
      images: JobListingImage[];
      sellerListing: SellerListingSpecs;
    }
  | {
      status: "generating";
      analysis: ItemAnalysis;
      images: JobListingImage[];
      sellerListing: SellerListingSpecs;
      startedAt: number;
    }
  | { status: "ready"; itemId: string }
  | { status: "error"; message: string };

type PersistedPayload = {
  analysis: ItemAnalysis;
  sellerListing: SellerListingSpecs;
  images: { url: string; mimeType: string }[];
};

const JOB_TTL_MS = 60 * 60_000;

export function newJobId(): string {
  return randomUUID();
}

function toPersistedPayload(
  analysis: ItemAnalysis,
  sellerListing: SellerListingSpecs,
  images: JobListingImage[],
): PersistedPayload {
  return {
    analysis,
    sellerListing,
    images: images.map(({ url, mimeType }) => ({ url, mimeType })),
  };
}

export async function commitAnalyzeJob(params: {
  id: string;
  analysis: ItemAnalysis;
  sellerListing: SellerListingSpecs;
  images: JobListingImage[];
}): Promise<void> {
  const payload = toPersistedPayload(params.analysis, params.sellerListing, params.images);
  await prisma.generationJob.create({
    data: {
      id: params.id,
      status: "ready-to-generate",
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });
}

async function pruneExpired(): Promise<void> {
  const cutoff = new Date(Date.now() - JOB_TTL_MS);
  await prisma.generationJob.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

function rowToJobState(row: {
  id: string;
  status: string;
  payload: unknown;
  itemId: string | null;
  errorMsg: string | null;
  startedAt: Date | null;
}): JobState | null {
  switch (row.status) {
    case "ready-to-generate": {
      const p = row.payload as PersistedPayload;
      return {
        status: "ready-to-generate",
        analysis: p.analysis,
        sellerListing: p.sellerListing,
        images: p.images.map((im) => ({ ...im })),
      };
    }
    case "generating": {
      const p = row.payload as PersistedPayload;
      return {
        status: "generating",
        analysis: p.analysis,
        sellerListing: p.sellerListing,
        images: p.images.map((im) => ({ ...im })),
        startedAt: row.startedAt?.getTime() ?? Date.now(),
      };
    }
    case "ready":
      return { status: "ready", itemId: row.itemId ?? row.id };
    case "error":
      return { status: "error", message: row.errorMsg ?? "Unknown error" };
    default:
      return null;
  }
}

export async function getJob(id: string): Promise<JobState | null> {
  await pruneExpired();
  const row = await prisma.generationJob.findUnique({ where: { id } });
  if (!row) return null;
  return rowToJobState(row);
}

export async function setJob(id: string, state: JobState): Promise<void> {
  await pruneExpired();
  const exists = await prisma.generationJob.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new Error(`Job ${id} does not exist`);

  switch (state.status) {
    case "ready-to-generate":
      await prisma.generationJob.update({
        where: { id },
        data: {
          status: state.status,
          payload: toPersistedPayload(state.analysis, state.sellerListing, state.images) as unknown as Prisma.InputJsonValue,
          itemId: null,
          errorMsg: null,
          startedAt: null,
        },
      });
      break;
    case "generating":
      await prisma.generationJob.update({
        where: { id },
        data: {
          status: state.status,
          payload: toPersistedPayload(state.analysis, state.sellerListing, state.images) as unknown as Prisma.InputJsonValue,
          startedAt: new Date(state.startedAt),
        },
      });
      break;
    case "ready":
      await prisma.generationJob.update({
        where: { id },
        data: {
          status: state.status,
          itemId: state.itemId,
          errorMsg: null,
        },
      });
      break;
    case "error":
      await prisma.generationJob.update({
        where: { id },
        data: {
          status: state.status,
          errorMsg: state.message,
        },
      });
      break;
    default:
      throw new Error(`Unsupported job status for persist: ${(state as JobState).status}`);
  }
}
