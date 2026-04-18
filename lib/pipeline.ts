import { getDedalus } from "./dedalus";
import { randomSeller } from "./fakeSeller";
import {
  visionPrompt,
  writerPrompt,
  directorPrompt,
  captionsPrompt,
} from "./prompts";

export type Caption = { text: string; startMs: number; endMs: number };

export type VisionAttrs = {
  itemName: string;
  category: "kitchen" | "clothing" | "electronics" | "decor" | "books" | "random";
  condition: string;
  materials: string;
  colors: string;
  heroFeatures: string[];
  background: string;
  askingPrice: number;
  originalPrice: number | null;
  urgencyDays: number;
};

export type ItemAnalysis = VisionAttrs & {
  script: string;
  videoPrompt: string;
  captions: Caption[];
  sellerName: string;
  sellerLocation: string;
};

const VISION_MODEL = "xai/grok-2-vision-latest";
const TEXT_MODEL = "xai/grok-4";

// Pretty-logs a pipeline step's name, elapsed milliseconds, and tokens used.
function logStep(
  label: string,
  ms: number,
  usage?: { prompt_tokens?: number; completion_tokens?: number },
) {
  const toks = usage
    ? ` · ${usage.prompt_tokens ?? "?"}→${usage.completion_tokens ?? "?"} toks`
    : "";
  console.log(`  ${label.padEnd(28)} ${`${ms}ms`.padStart(7)}${toks}`);
}

// Sends a vision prompt + image through Dedalus and parses the returned JSON object.
async function callVision(prompt: string, imageBytes: Buffer, mime: string): Promise<Record<string, unknown>> {
  const dataUrl = `data:${mime};base64,${imageBytes.toString("base64")}`;
  const res = await getDedalus().chat.completions.create({
    model: VISION_MODEL,
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const raw = res.choices[0].message.content ?? "{}";
  return { __parsed: JSON.parse(raw), __usage: res.usage };
}

// Sends a text-only prompt through Dedalus and parses the returned JSON object.
async function callText(prompt: string, temperature = 1.0): Promise<Record<string, unknown>> {
  const res = await getDedalus().chat.completions.create({
    model: TEXT_MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  const raw = res.choices[0].message.content ?? "{}";
  return { __parsed: JSON.parse(raw), __usage: res.usage };
}

// Orchestrates the 4 sequential Dedalus calls that produce a full marketplace listing from one photo.
export async function runPipeline(imageBytes: Buffer, mime: string): Promise<ItemAnalysis> {
  const t0 = Date.now();
  console.log("\n→ Dedalus orchestration pipeline");

  const s1Start = Date.now();
  const v = await callVision(visionPrompt(), imageBytes, mime);
  const vision = v.__parsed as VisionAttrs;
  logStep("[1/4] vision", Date.now() - s1Start, v.__usage as any);

  const s2Start = Date.now();
  const w = await callText(writerPrompt(vision as unknown as Record<string, unknown>));
  const scriptData = w.__parsed as { script: string };
  logStep("[2/4] writer", Date.now() - s2Start, w.__usage as any);

  const s3Start = Date.now();
  const d = await callText(directorPrompt(vision as unknown as Record<string, unknown>, scriptData), 0.7);
  const videoData = d.__parsed as { videoPrompt: string };
  logStep("[3/4] director", Date.now() - s3Start, d.__usage as any);

  const s4Start = Date.now();
  const c = await callText(captionsPrompt(scriptData), 0.3);
  const captionsData = c.__parsed as { captions: Caption[] };
  logStep("[4/4] captions", Date.now() - s4Start, c.__usage as any);

  const seller = randomSeller();
  console.log(`  pipeline total              ${`${Date.now() - t0}ms`.padStart(7)}\n`);

  return {
    ...vision,
    script: scriptData.script,
    videoPrompt: videoData.videoPrompt,
    captions: captionsData.captions,
    sellerName: seller.name,
    sellerLocation: seller.location,
  };
}
