import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

// Ensures the public asset folders exist for uploads and generated videos.
export function ensurePublicDirs(): void {
  mkdirSync(join(ROOT, "public", "uploads"), { recursive: true });
  mkdirSync(join(ROOT, "public", "generated"), { recursive: true });
  mkdirSync(join(ROOT, "tmp"), { recursive: true });
}

// Writes an uploaded image to public/uploads and returns the public URL path.
// Use index 0 (default) for the primary `{id}.ext`; index 1+ writes `{id}-{index}.ext` for extra angles.
export function writeUpload(params: {
  id: string;
  bytes: Buffer;
  ext: "jpg" | "png" | "webp";
  index?: number;
}): string {
  ensurePublicDirs();
  const suffix = params.index && params.index > 0 ? `-${params.index}` : "";
  const rel = `/uploads/${params.id}${suffix}.${params.ext}`;
  const abs = join(ROOT, "public", "uploads", `${params.id}${suffix}.${params.ext}`);
  writeFileSync(abs, params.bytes);
  return rel;
}

// Writes a generated mp4 to public/generated and returns the public URL path.
export function writeGeneratedVideo(params: { id: string; bytes: Buffer }): string {
  ensurePublicDirs();
  const rel = `/generated/${params.id}.mp4`;
  const abs = join(ROOT, "public", "generated", `${params.id}.mp4`);
  writeFileSync(abs, params.bytes);
  return rel;
}

