import { NextResponse } from "next/server";
import { getJob } from "../../../../lib/jobs";

// Returns the current job state for client polling during generation.
export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: "Unknown jobId" }, { status: 404 });
  return NextResponse.json({ jobId, ...job });
}

