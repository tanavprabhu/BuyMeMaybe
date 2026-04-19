import { NextResponse } from "next/server";
import { analyzeItem } from "../../../lib/gemini";
import { createJob, setJob, type JobListingImage } from "../../../lib/jobs";
import { parseAskingPriceUsd, type SellerListingSpecs } from "../../../lib/seller-specs";
import { writeUpload } from "../../../lib/storage";

const MAX_LISTING_IMAGES = 7;

type AnalyzeResponse = {
  jobId: string;
  imageUrl: string;
  imageUrls: string[];
  analysis: unknown;
};

function mimeToExt(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function readSellerSpecs(form: FormData): SellerListingSpecs {
  const g = (k: string) => String(form.get(k) ?? "").trim();
  return {
    titleLine: g("listingTitle"),
    detailLine: g("listingDetail"),
    extra: g("listingExtra"),
    askingPriceInput: g("listingPrice"),
    sellerCategoryKey: g("sellerCategory"),
  };
}

function collectListingFiles(form: FormData): File[] {
  const multi = form
    .getAll("images")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (multi.length > 0) return multi.slice(0, MAX_LISTING_IMAGES);
  const one = form.get("image");
  if (one instanceof File && one.size > 0) return [one];
  return [];
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = collectListingFiles(form);
    if (files.length === 0) {
      return NextResponse.json(
        { error: `Add at least one photo (up to ${MAX_LISTING_IMAGES}). Use form field "images" or legacy "image".` },
        { status: 400 },
      );
    }

    const jobId = createJob();
    const seller = readSellerSpecs(form);

    const images: JobListingImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const mime = file.type || "image/jpeg";
      const bytes = Buffer.from(await file.arrayBuffer());
      const url = writeUpload({ id: jobId, bytes, ext: mimeToExt(mime), index: i });
      images.push({ url, mimeType: mime, bytes });
    }

    const analysis = await analyzeItem(
      images.map((im) => ({ bytes: im.bytes, mimeType: im.mimeType })),
      { seller },
    );

    const priceOverride = parseAskingPriceUsd(seller.askingPriceInput);
    if (priceOverride != null) {
      analysis.askingPrice = priceOverride;
    }

    setJob(jobId, { status: "ready-to-generate", analysis, images, sellerListing: seller });

    const imageUrl = images[0]!.url;
    const body: AnalyzeResponse = {
      jobId,
      imageUrl,
      imageUrls: images.map((im) => im.url),
      analysis,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /^402\b/.test(message.trim()) ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
