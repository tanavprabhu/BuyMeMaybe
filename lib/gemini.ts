import { runPipeline, type ItemAnalysis, type Caption, type RunPipelineOptions } from "./pipeline";

export type { ItemAnalysis, Caption, RunPipelineOptions };

// Runs the xAI 4-step pipeline and returns a full marketplace listing from one photo.
export async function analyzeItem(
  imageBytes: Buffer,
  mimeType: string,
  opts?: RunPipelineOptions,
): Promise<ItemAnalysis> {
  return runPipeline(imageBytes, mimeType, opts);
}
