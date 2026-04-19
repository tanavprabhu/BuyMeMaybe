import { runPipeline, type ItemAnalysis, type Caption, type RunPipelineOptions } from "./pipeline";

export type { ItemAnalysis, Caption, RunPipelineOptions };

export async function analyzeItem(
  images: { bytes: Buffer; mimeType: string }[],
  opts?: RunPipelineOptions,
): Promise<ItemAnalysis> {
  return runPipeline(images, opts);
}
