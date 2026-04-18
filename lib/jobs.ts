import { randomUUID } from "node:crypto";
import type { ItemAnalysis } from "./gemini";

export type JobState =
  | { status: "pending-analyze" }
  | { status: "ready-to-generate"; analysis: ItemAnalysis; imageUrl: string; mimeType: string; imageBytes: Buffer }
  | { status: "generating"; analysis: ItemAnalysis; imageUrl: string; mimeType: string; imageBytes: Buffer; startedAt: number }
  | { status: "ready"; itemId: string }
  | { status: "error"; message: string };

type InternalJob = { id: string; createdAt: number; state: JobState };

const jobs = new Map<string, InternalJob>();
const JOB_TTL_MS = 60 * 60_000;

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

