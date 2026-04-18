import { loadRootEnv } from "./root-env";

export type VideoParams = {
  imageBytes: Buffer;
  mimeType: string;
  videoPrompt: string;
  durationSec?: number;
};

// Kicks off a Grok Imagine video job and returns the xAI request_id for polling.
async function submitJob(params: VideoParams): Promise<string> {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(
      "XAI_API_KEY is missing. Add it to .env or .env.local in the project root, then restart `npm run dev`.",
    );
  }
  const dataUrl = `data:${params.mimeType};base64,${params.imageBytes.toString("base64")}`;

  const res = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine-video",
      prompt: params.videoPrompt,
      image: { url: dataUrl },
      duration: params.durationSec ?? 12,
      aspect_ratio: "9:16",
      resolution: "720p",
    }),
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

// Polls Grok Imagine for a specific job until done or failed, sleeping pollMs between checks.
async function pollUntilDone(requestId: string, pollMs = 5000): Promise<string> {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(
      "XAI_API_KEY is missing. Add it to .env or .env.local in the project root, then restart `npm run dev`.",
    );
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

// Generates a talking-item video via Grok Imagine and returns the mp4 bytes.
export async function generateTalkingVideo(params: VideoParams): Promise<Buffer> {
  const t0 = Date.now();
  const id = await submitJob(params);
  console.log(`  [grok imagine] queued ${id}`);
  const url = await pollUntilDone(id);
  const mp4 = await fetch(url);
  if (!mp4.ok) throw new Error(`Download mp4 ${mp4.status}`);
  const buf = Buffer.from(await mp4.arrayBuffer());
  console.log(`  [grok imagine] mp4 ready (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${Date.now() - t0}ms)`);
  return buf;
}
