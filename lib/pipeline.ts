import { getXaiOpenAI } from "./xai-openai";
import { randomSeller } from "./fakeSeller";
import {
  visionPrompt,
  writerPrompt,
  directorPrompt,
} from "./prompts";
import type { SellerListingSpecs } from "./seller-specs";
import { sellerSpecsPromptBlock } from "./seller-specs";

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

export type RunPipelineOptions = {
  seller?: SellerListingSpecs;
};

// Resolves the vision model id (must accept image + text; see xAI console for availability).
function visionModel(): string {
  return process.env.XAI_VISION_MODEL ?? "grok-4-1-fast-non-reasoning";
}

// Resolves the text model id for writer/director/captions steps (JSON / structured output).
function textModel(): string {
  return process.env.XAI_TEXT_MODEL ?? "grok-4-1-fast-non-reasoning";
}

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

// Sends a vision prompt + image through xAI and parses the returned JSON object.
async function callVision(prompt: string, imageBytes: Buffer, mime: string): Promise<Record<string, unknown>> {
  const dataUrl = `data:${mime};base64,${imageBytes.toString("base64")}`;
  const res = await getXaiOpenAI().chat.completions.create({
    model: visionModel(),
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

// Sends a text-only prompt through xAI and parses the returned JSON object.
async function callText(prompt: string, temperature = 1.0): Promise<Record<string, unknown>> {
  const res = await getXaiOpenAI().chat.completions.create({
    model: textModel(),
    temperature,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  const raw = res.choices[0].message.content ?? "{}";
  return { __parsed: JSON.parse(raw), __usage: res.usage };
}

// Orchestrates the three sequential xAI calls that produce a full marketplace listing from one photo.
export async function runPipeline(
  imageBytes: Buffer,
  mime: string,
  opts?: RunPipelineOptions,
): Promise<ItemAnalysis> {
  const sellerBlock = opts?.seller ? sellerSpecsPromptBlock(opts.seller) : null;
  const t0 = Date.now();
  console.log("\n→ xAI listing pipeline");

  const s1Start = Date.now();
  const v = await callVision(visionPrompt(sellerBlock), imageBytes, mime);
  const vision = v.__parsed as VisionAttrs;
  logStep("[1/3] vision", Date.now() - s1Start, v.__usage as any);

  const s2Start = Date.now();
  const w = await callText(writerPrompt(vision as unknown as Record<string, unknown>, sellerBlock));
  const scriptData = w.__parsed as { script: string };
  logStep("[2/3] writer", Date.now() - s2Start, w.__usage as any);

  const s3Start = Date.now();
  const d = await callText(directorPrompt(vision as unknown as Record<string, unknown>, scriptData), 0.7);
  const videoData = d.__parsed as { videoPrompt: string };
  logStep("[3/3] director", Date.now() - s3Start, d.__usage as any);

  const seller = randomSeller();
  console.log(`  pipeline total              ${`${Date.now() - t0}ms`.padStart(7)}\n`);

  return {
    ...vision,
    script: scriptData.script,
    videoPrompt: videoData.videoPrompt,
    captions: [],
    sellerName: seller.name,
    sellerLocation: seller.location,
  };
}
