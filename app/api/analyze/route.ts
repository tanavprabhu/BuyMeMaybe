import { NextResponse } from "next/server";
import { analyzeItem } from "../../../lib/gemini";
import { createJob, setJob } from "../../../lib/jobs";
import { parseAskingPriceUsd, type SellerListingSpecs } from "../../../lib/seller-specs";
import { writeUpload } from "../../../lib/storage";

type AnalyzeResponse = {
  jobId: string;
  imageUrl: string;
  analysis: unknown;
};

// Converts a MIME type string to an image file extension we support.
function mimeToExt(mime: string): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

// Reads optional listing spec fields from multipart form data.
function readSellerSpecs(form: FormData): SellerListingSpecs {
  const g = (k: string) => String(form.get(k) ?? "").trim();
  return {
    titleLine: g("listingTitle"),
    detailLine: g("listingDetail"),
    extra: g("listingExtra"),
    askingPriceInput: g("listingPrice"),
  };
}

// Accepts an uploaded image, runs the AI analysis pipeline, and stores the result in an in-memory job.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing form-data field "image".' }, { status: 400 });
    }

    const mime = file.type || "image/jpeg";
    const bytes = Buffer.from(await file.arrayBuffer());
    const jobId = createJob();

    const seller = readSellerSpecs(form);
    const imageUrl = writeUpload({ id: jobId, bytes, ext: mimeToExt(mime) });
    const analysis = await analyzeItem(bytes, mime, { seller });

    const priceOverride = parseAskingPriceUsd(seller.askingPriceInput);
    if (priceOverride != null) {
      analysis.askingPrice = priceOverride;
    }

    setJob(jobId, { status: "ready-to-generate", analysis, imageUrl, mimeType: mime, imageBytes: bytes });

    const body: AnalyzeResponse = { jobId, imageUrl, analysis };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = /^402\b/.test(message.trim()) ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
