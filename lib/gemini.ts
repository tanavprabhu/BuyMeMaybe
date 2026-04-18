import { runPipeline, type ItemAnalysis, type Caption } from "./pipeline";

export type { ItemAnalysis, Caption };

// Runs the Dedalus-orchestrated 4-step pipeline and returns a full marketplace listing from one photo.
export async function analyzeItem(
  imageBytes: Buffer,
  mimeType: string,
): Promise<ItemAnalysis> {
  return runPipeline(imageBytes, mimeType);
}
