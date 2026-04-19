import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { del, put } from "@vercel/blob";

const ROOT = process.cwd();

const EXT_MIME: Record<"jpg" | "png" | "webp", string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function ensurePublicDirs(): void {
  if (useBlobStorage()) return;
  mkdirSync(join(ROOT, "public", "uploads"), { recursive: true });
  mkdirSync(join(ROOT, "public", "generated"), { recursive: true });
  mkdirSync(join(ROOT, "tmp"), { recursive: true });
}

export async function writeUpload(params: {
  id: string;
  bytes: Buffer;
  ext: "jpg" | "png" | "webp";
  index?: number;
}): Promise<string> {
  const suffix = params.index && params.index > 0 ? `-${params.index}` : "";
  const filename = `${params.id}${suffix}.${params.ext}`;

  if (useBlobStorage()) {
    const pathname = `uploads/${filename}`;
    const blob = await put(pathname, params.bytes, {
      access: "public",
      contentType: EXT_MIME[params.ext],
      addRandomSuffix: false,
    });
    return blob.url;
  }

  ensurePublicDirs();
  const rel = `/uploads/${filename}`;
  const abs = join(ROOT, "public", "uploads", filename);
  writeFileSync(abs, params.bytes);
  return rel;
}

export async function writeGeneratedVideo(params: { id: string; bytes: Buffer }): Promise<string> {
  const filename = `${params.id}.mp4`;

  if (useBlobStorage()) {
    const pathname = `generated/${filename}`;
    const blob = await put(pathname, params.bytes, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  ensurePublicDirs();
  const rel = `/generated/${filename}`;
  const abs = join(ROOT, "public", "generated", filename);
  writeFileSync(abs, params.bytes);
  return rel;
}

/** Remove a listing asset (local `/…` path or hosted blob `https://…`). */
export async function deleteStoredAsset(publicUrl: string | null | undefined): Promise<string | null> {
  if (!publicUrl) return null;

  if (publicUrl.startsWith("http://") || publicUrl.startsWith("https://")) {
    if (!useBlobStorage()) {
      return "BLOB_READ_WRITE_TOKEN is not set; cannot delete remote blob.";
    }
    try {
      await del(publicUrl);
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `Failed to delete blob: ${msg}`;
    }
  }

  if (!publicUrl.startsWith("/")) return null;
  const publicRoot = resolve(ROOT, "public");
  const abs = resolve(publicRoot, `.${publicUrl}`);
  if (!abs.startsWith(publicRoot)) return "Refusing to delete path outside /public.";
  if (!existsSync(abs)) return null;
  try {
    unlinkSync(abs);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `Failed to delete ${publicUrl}: ${msg}`;
  }
}
