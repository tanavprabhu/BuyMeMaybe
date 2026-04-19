import { NextResponse } from "next/server";
import { jobToPublicJson } from "../../../../lib/job-public";
import { getJob } from "../../../../lib/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId: rawJobId } = await ctx.params;
  const jobId = rawJobId.trim();
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: "Unknown jobId" }, { status: 404 });
  return NextResponse.json(jobToPublicJson(jobId, job));
}

