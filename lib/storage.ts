import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

export function ensurePublicDirs(): void {
  mkdirSync(join(ROOT, "public", "uploads"), { recursive: true });
  mkdirSync(join(ROOT, "public", "generated"), { recursive: true });
  mkdirSync(join(ROOT, "tmp"), { recursive: true });
}

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

export function writeGeneratedVideo(params: { id: string; bytes: Buffer }): string {
  ensurePublicDirs();
  const rel = `/generated/${params.id}.mp4`;
  const abs = join(ROOT, "public", "generated", `${params.id}.mp4`);
  writeFileSync(abs, params.bytes);
  return rel;
}

