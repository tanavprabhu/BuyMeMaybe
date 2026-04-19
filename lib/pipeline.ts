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

function visionModel(): string {
  return process.env.XAI_VISION_MODEL ?? "grok-4-1-fast-non-reasoning";
}

function textModel(): string {
  return process.env.XAI_TEXT_MODEL ?? "grok-4-1-fast-non-reasoning";
}

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

type VisionShot = { bytes: Buffer; mime: string };

async function callVision(prompt: string, shots: VisionShot[]): Promise<Record<string, unknown>> {
  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: prompt },
  ];
  for (let i = 0; i < shots.length; i++) {
    if (shots.length > 1) {
      content.push({ type: "text", text: `\n--- Photo ${i + 1} of ${shots.length} ---\n` });
    }
    const dataUrl = `data:${shots[i].mime};base64,${shots[i].bytes.toString("base64")}`;
    content.push({ type: "image_url", image_url: { url: dataUrl } });
  }
  const res = await getXaiOpenAI().chat.completions.create({
    model: visionModel(),
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content }],
  });
  const raw = res.choices[0].message.content ?? "{}";
  return { __parsed: JSON.parse(raw), __usage: res.usage };
}

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

export async function runPipeline(
  images: { bytes: Buffer; mimeType: string }[],
  opts?: RunPipelineOptions,
): Promise<ItemAnalysis> {
  if (images.length === 0) throw new Error("runPipeline requires at least one image");
  const shots: VisionShot[] = images.map((im) => ({ bytes: im.bytes, mime: im.mimeType }));
  const sellerBlock = opts?.seller ? sellerSpecsPromptBlock(opts.seller) : null;
  const t0 = Date.now();
  console.log(`\n→ xAI listing pipeline (${images.length} image${images.length > 1 ? "s" : ""})`);

  const s1Start = Date.now();
  const v = await callVision(visionPrompt(sellerBlock, images.length), shots);
  const vision = v.__parsed as VisionAttrs;
  logStep("[1/3] vision", Date.now() - s1Start, v.__usage as any);

  const s2Start = Date.now();
  const w = await callText(writerPrompt(vision as unknown as Record<string, unknown>, sellerBlock));
  const scriptData = w.__parsed as { script: string };
  logStep("[2/3] writer", Date.now() - s2Start, w.__usage as any);

  const s3Start = Date.now();
  const d = await callText(
    directorPrompt(vision as unknown as Record<string, unknown>, scriptData, images.length),
    0.7,
  );
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
