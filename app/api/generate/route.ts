import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { withDedalusMachineHooks } from "../../../lib/dedalus";
import { getJob, setJob, type JobState } from "../../../lib/jobs";
import { listingImageBytesFromUrl } from "../../../lib/listing-image-bytes";
import { generateTalkingVideo } from "../../../lib/video";
import { makeFinalVideo } from "../../../lib/ffmpeg";
import { writeGeneratedVideo } from "../../../lib/storage";

type GenerateRequest = { jobId?: string };

async function hydrateReadyJob(
  job: Extract<JobState, { status: "ready-to-generate" }>,
): Promise<{
  status: "ready-to-generate";
  analysis: (typeof job)["analysis"];
  images: { url: string; mimeType: string; bytes: Buffer }[];
  sellerListing: (typeof job)["sellerListing"];
}> {
  const images = await Promise.all(
    job.images.map(async (im) => {
      const bytes = im.bytes ?? (await listingImageBytesFromUrl(im.url));
      if (!bytes.length) throw new Error(`Empty image bytes for ${im.url}`);
      return { url: im.url, mimeType: im.mimeType, bytes };
    }),
  );
  return { ...job, images };
}

async function runGeneration(jobId: string): Promise<void> {
  const raw = await getJob(jobId);
  if (!raw || raw.status !== "ready-to-generate") throw new Error("Job is not ready to generate.");

  const job = await hydrateReadyJob(raw);

  const { analysis, images, sellerListing } = job;
  await setJob(jobId, {
    status: "generating",
    analysis,
    images,
    sellerListing,
    startedAt: Date.now(),
  });

  await withDedalusMachineHooks(`generate:${jobId}`, async () => {
    const primary = images[0]!;
    const rawVideo =
      images.length >= 2
        ? await generateTalkingVideo({
            videoPrompt: analysis.videoPrompt,
            durationSec: 10,
            referenceImages: images.map((im) => ({ bytes: im.bytes, mimeType: im.mimeType })),
          })
        : await generateTalkingVideo({
            imageBytes: primary.bytes,
            mimeType: primary.mimeType,
            videoPrompt: analysis.videoPrompt,
            durationSec: 10,
          });

    const finalVideo = await makeFinalVideo({ rawVideoMp4: rawVideo });

    const videoUrl = await writeGeneratedVideo({ id: jobId, bytes: finalVideo });
    const imageUrl = primary.url;

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
        listingLine1: sellerListing.titleLine.trim() || null,
        listingLine2: sellerListing.detailLine.trim() || null,
        listingExtra: sellerListing.extra.trim() || null,
        sellerCategoryKey: sellerListing.sellerCategoryKey?.trim() || null,
        captions: JSON.stringify(analysis.captions),
      },
    });

    await setJob(jobId, { status: "ready", itemId: jobId });
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as GenerateRequest;
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    const state = await getJob(jobId);
    if (!state) return NextResponse.json({ error: "Unknown jobId" }, { status: 404 });
    if (state.status === "ready") return NextResponse.json({ ok: true, itemId: state.itemId });
    if (state.status === "generating") return NextResponse.json({ ok: true });
    if (state.status === "error") return NextResponse.json({ error: state.message }, { status: 500 });
    if (state.status !== "ready-to-generate") return NextResponse.json({ error: "Job not ready" }, { status: 409 });

    runGeneration(jobId).catch(async (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      try {
        await setJob(jobId, { status: "error", message });
      } catch {
        /* job row missing */
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
