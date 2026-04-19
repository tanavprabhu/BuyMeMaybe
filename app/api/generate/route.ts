import { after, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { withDedalusMachineHooks } from "../../../lib/dedalus";
import { getJob, setJob, type JobListingImage } from "../../../lib/jobs";
import type { ItemAnalysis } from "../../../lib/gemini";
import type { SellerListingSpecs } from "../../../lib/seller-specs";
import { listingImageBytesFromUrl } from "../../../lib/listing-image-bytes";
import { generateTalkingVideo } from "../../../lib/video";
import { makeFinalVideo } from "../../../lib/ffmpeg";
import { writeGeneratedVideo } from "../../../lib/storage";

export const maxDuration = 300;

type GenerateRequest = { jobId?: string };

async function hydrateListingImages(params: {
  analysis: ItemAnalysis;
  sellerListing: SellerListingSpecs;
  images: JobListingImage[];
}): Promise<{
  analysis: ItemAnalysis;
  sellerListing: SellerListingSpecs;
  images: { url: string; mimeType: string; bytes: Buffer }[];
}> {
  const images = await Promise.all(
    params.images.map(async (im) => {
      const bytes = im.bytes ?? (await listingImageBytesFromUrl(im.url));
      if (!bytes.length) throw new Error(`Empty image bytes for ${im.url}`);
      return { url: im.url, mimeType: im.mimeType, bytes };
    }),
  );
  return { analysis: params.analysis, sellerListing: params.sellerListing, images };
}

async function runGeneration(jobId: string): Promise<void> {
  const claimed = await prisma.generationJob.updateMany({
    where: { id: jobId, status: "ready-to-generate" },
    data: { status: "generating", startedAt: new Date() },
  });

  if (claimed.count === 0) {
    const existing = await getJob(jobId);
    if (!existing) throw new Error("Unknown job");
    if (existing.status === "ready" || existing.status === "generating") return;
    if (existing.status === "error") throw new Error(existing.message);
    return;
  }

  const raw = await getJob(jobId);
  if (!raw || raw.status !== "generating") throw new Error("Job is not generating after claim.");

  const { analysis, images, sellerListing } = await hydrateListingImages({
    analysis: raw.analysis,
    sellerListing: raw.sellerListing,
    images: raw.images,
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

    after(async () => {
      try {
        await runGeneration(jobId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        try {
          await setJob(jobId, { status: "error", message });
        } catch {
          /* job row missing */
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
