import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getJob, setJob } from "../../../lib/jobs";
import { generateVoice } from "../../../lib/voice";
import { generateTalkingVideo } from "../../../lib/video";
import { makeFinalVideo } from "../../../lib/ffmpeg";
import { writeGeneratedVideo } from "../../../lib/storage";

type GenerateRequest = { jobId?: string };

// Runs the full generation pipeline (voice → video → ffmpeg → DB insert) for a job id.
async function runGeneration(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job || job.status !== "ready-to-generate") throw new Error("Job is not ready to generate.");

  const { analysis, imageUrl, mimeType, imageBytes } = job;
  setJob(jobId, {
    status: "generating",
    analysis,
    imageUrl,
    mimeType,
    imageBytes,
    startedAt: Date.now(),
  });

  const voice = await generateVoice(analysis.script);
  const rawVideo = await generateTalkingVideo({
    imageBytes,
    mimeType,
    videoPrompt: analysis.videoPrompt,
    durationSec: 15,
  });

  const finalVideo = await makeFinalVideo({
    rawVideoMp4: rawVideo,
    voiceMp3: voice,
  });

  const videoUrl = writeGeneratedVideo({ id: jobId, bytes: finalVideo });

  await prisma.item.create({
    data: {
      id: jobId,
      itemName: analysis.itemName,
      category: analysis.category,
      script: analysis.script,
      videoUrl,
      imageUrl,
      askingPrice: analysis.askingPrice,
      originalPrice: analysis.originalPrice ?? undefined,
      urgencyDays: analysis.urgencyDays,
      sellerName: analysis.sellerName,
      sellerLocation: analysis.sellerLocation,
      captions: JSON.stringify(analysis.captions),
    },
  });

  setJob(jobId, { status: "ready", itemId: jobId });
}

// Kicks off async generation for a previously analyzed job and returns immediately for polling.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as GenerateRequest;
    const jobId = body.jobId;
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    const state = getJob(jobId);
    if (!state) return NextResponse.json({ error: "Unknown jobId" }, { status: 404 });
    if (state.status === "ready") return NextResponse.json({ ok: true, itemId: state.itemId });
    if (state.status === "generating") return NextResponse.json({ ok: true });
    if (state.status === "error") return NextResponse.json({ error: state.message }, { status: 500 });
    if (state.status !== "ready-to-generate") return NextResponse.json({ error: "Job not ready" }, { status: 409 });

    runGeneration(jobId).catch((err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      setJob(jobId, { status: "error", message });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

