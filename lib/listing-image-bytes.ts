import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Load image bytes for pipeline (local `/public/...` path or remote Blob URL). */
export async function listingImageBytesFromUrl(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    const abs = join(process.cwd(), "public", url.replace(/^\//, ""));
    return readFileSync(abs);
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch listing image (${res.status}): ${url.slice(0, 96)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
