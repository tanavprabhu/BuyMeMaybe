import type { JobState } from "./jobs";

export function jobToPublicJson(jobId: string, job: JobState): Record<string, unknown> {
  const base = { jobId };
  switch (job.status) {
    case "ready-to-generate":
      return {
        ...base,
        status: job.status,
        imageUrl: job.images[0]?.url ?? "",
        imageUrls: job.images.map((i) => i.url),
      };
    case "generating":
      return { ...base, status: job.status, startedAt: job.startedAt };
    case "ready":
      return { ...base, status: job.status, itemId: job.itemId };
    case "error":
      return { ...base, status: job.status, message: job.message };
  }
}
