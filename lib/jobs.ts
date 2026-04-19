import { randomUUID } from "node:crypto";
import type { ItemAnalysis } from "./gemini";
import type { SellerListingSpecs } from "./seller-specs";

export type JobListingImage = { url: string; mimeType: string; bytes: Buffer };

export type JobState =
  | { status: "pending-analyze" }
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

type InternalJob = { id: string; createdAt: number; state: JobState };

const JOB_TTL_MS = 60 * 60_000;

// Persist the store on `globalThis` so Turbopack/HMR or route-module reloads do not
// wipe in-memory jobs between `/api/analyze` and `/api/generate` in dev.
const globalJobs = globalThis as unknown as { __bmmJobStore?: Map<string, InternalJob> };
if (!globalJobs.__bmmJobStore) {
  globalJobs.__bmmJobStore = new Map<string, InternalJob>();
}
const jobs = globalJobs.__bmmJobStore;

// Creates a new job id and registers it as pending analysis.
export function createJob(): string {
  const id = randomUUID();
  jobs.set(id, { id, createdAt: Date.now(), state: { status: "pending-analyze" } });
  return id;
}

// Returns the job state for a given id, if it exists and hasn't expired.
export function getJob(id: string): JobState | null {
  cleanupExpired();
  return jobs.get(id)?.state ?? null;
}

// Updates a job state if it exists.
export function setJob(id: string, state: JobState): void {
  cleanupExpired();
  const job = jobs.get(id);
  if (!job) throw new Error(`Job ${id} does not exist`);
  job.state = state;
}

// Removes expired jobs to keep memory bounded during dev.
export function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

