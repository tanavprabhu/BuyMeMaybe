import { missingXaiApiKeyMessage } from "./env-messages";
import { loadRootEnv } from "./root-env";

export type VideoParams = {
  videoPrompt: string;
  durationSec?: number;
  imageBytes?: Buffer;
  mimeType?: string;
  referenceImages?: { bytes: Buffer; mimeType: string }[];
};

async function submitJob(params: VideoParams): Promise<string> {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(missingXaiApiKeyMessage());
  }

  const refs = (params.referenceImages ?? []).filter((r) => r.bytes.length > 0);
  let body: Record<string, unknown>;

  if (refs.length >= 2) {
    body = {
      model: "grok-imagine-video",
      prompt: params.videoPrompt,
      duration: params.durationSec ?? 10,
      aspect_ratio: "1:1",
      resolution: "720p",
      reference_images: refs.map((r) => ({
        url: `data:${r.mimeType};base64,${r.bytes.toString("base64")}`,
      })),
    };
  } else {
    const bytes = refs.length === 1 ? refs[0].bytes : params.imageBytes;
    const mime = refs.length === 1 ? refs[0].mimeType : params.mimeType;
    if (!bytes?.length || !mime) {
      throw new Error(
        "Grok Imagine: pass imageBytes + mimeType for one image, or referenceImages with at least two photos.",
      );
    }
    body = {
      model: "grok-imagine-video",
      prompt: params.videoPrompt,
      duration: params.durationSec ?? 10,
      aspect_ratio: "1:1",
      resolution: "720p",
      image: { url: `data:${mime};base64,${bytes.toString("base64")}` },
    };
  }

  const res = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Grok Imagine submit ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { request_id: string };
  return json.request_id;
}

type StatusResponse = {
  status: string;
  video?: { url: string; duration: number };
  error?: string;
};

async function pollUntilDone(requestId: string, pollMs = 5000): Promise<string> {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(missingXaiApiKeyMessage());
  }
  const deadline = Date.now() + 15 * 60_000;
  let last = "";
  while (Date.now() < deadline) {
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`Grok Imagine poll ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as StatusResponse;
    if (json.status !== last) {
      console.log(`  [grok imagine] ${json.status}`);
      last = json.status;
    }
    if (json.status === "done" && json.video?.url) return json.video.url;
    if (json.status === "failed" || json.error) throw new Error(`Grok Imagine failed: ${json.error ?? "unknown"}`);
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error("Grok Imagine timed out after 15 minutes");
}

export async function generateTalkingVideo(params: VideoParams): Promise<Buffer> {
  const t0 = Date.now();
  const refCount = (params.referenceImages ?? []).filter((r) => r.bytes.length > 0).length;
  console.log(`  [grok imagine] ${refCount >= 2 ? `reference-to-video (${refCount} refs)` : "image-to-video"}`);
  const id = await submitJob(params);
  console.log(`  [grok imagine] queued ${id}`);
  const url = await pollUntilDone(id);
  const mp4 = await fetch(url);
  if (!mp4.ok) throw new Error(`Download mp4 ${mp4.status}`);
  const buf = Buffer.from(await mp4.arrayBuffer());
  console.log(`  [grok imagine] mp4 ready (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${Date.now() - t0}ms)`);
  return buf;
}
