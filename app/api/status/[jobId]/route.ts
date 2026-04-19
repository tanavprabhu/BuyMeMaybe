import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { jobToPublicJson } from "../../../../lib/job-public";
import { getJob } from "../../../../lib/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId: rawJobId } = await ctx.params;
  const jobId = rawJobId.trim();
  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "Unknown jobId" }, { status: 404 });
  const body = jobToPublicJson(jobId, job);
  if (job.status === "ready") {
    const item = await prisma.item.findUnique({
      where: { id: job.itemId },
      select: { videoUrl: true },
    });
    return NextResponse.json({ ...body, videoUrl: item?.videoUrl ?? "" });
  }
  return NextResponse.json(body);
}

