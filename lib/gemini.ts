import { runPipeline, type ItemAnalysis, type Caption, type RunPipelineOptions } from "./pipeline";

export type { ItemAnalysis, Caption, RunPipelineOptions };

// Runs the xAI 4-step pipeline and returns a full marketplace listing from one or more photos of the same item.
export async function analyzeItem(
  images: { bytes: Buffer; mimeType: string }[],
  opts?: RunPipelineOptions,
): Promise<ItemAnalysis> {
  return runPipeline(images, opts);
}
