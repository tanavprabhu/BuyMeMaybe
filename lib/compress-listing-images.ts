const MAX_EDGE_PX = 1600;
const NAME_SAFE = /[^\w.-]+/g;

function baseName(name: string): string {
  const n = name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  const cleaned = n.replace(NAME_SAFE, "_").slice(0, 80);
  return cleaned.length > 0 ? cleaned : "photo";
}

async function bitmapToJpegFile(bitmap: ImageBitmap, quality: number, name: string): Promise<File | null> {
  const w = bitmap.width;
  const h = bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob) return null;
  return new File([blob], `${baseName(name)}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

async function compressOne(file: File): Promise<File> {
  if (file.size < 350_000 && (file.type === "image/jpeg" || file.type === "image/webp")) {
    return file;
  }

  let open: ImageBitmap;
  try {
    open = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const { width, height } = open;
    const maxEdge = Math.max(width, height);
    const scale = maxEdge > MAX_EDGE_PX ? MAX_EDGE_PX / maxEdge : 1;
    const tw = Math.max(1, Math.round(width * scale));
    const th = Math.max(1, Math.round(height * scale));

    if (scale < 1) {
      const scaled = await createImageBitmap(open, {
        resizeWidth: tw,
        resizeHeight: th,
        resizeQuality: "high",
      });
      open.close();
      open = scaled;
    }

    let q = 0.88;
    let best: File | null = null;
    for (let pass = 0; pass < 5; pass++) {
      const out = await bitmapToJpegFile(open, q, file.name);
      if (!out) break;
      if (!best || out.size < best.size) best = out;
      if (out.size < 900_000 || q < 0.55) {
        best = out;
        break;
      }
      q -= 0.1;
    }

    if (best && best.size < file.size) return best;
    if (best) return best;
    return file;
  } catch {
    return file;
  } finally {
    try {
      open.close();
    } catch {
      /* ignore */
    }
  }
}

export async function compressListingImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressOne(f)));
}
