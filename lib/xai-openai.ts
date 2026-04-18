import OpenAI from "openai";
import { loadRootEnv } from "./root-env";

let cached: OpenAI | null = null;

// Returns a shared OpenAI SDK client for xAI's OpenAI-compatible base URL (chat + vision).
export function getXaiOpenAI(): OpenAI {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(
      "XAI_API_KEY is missing. Add it to .env or .env.local in the project root, then restart `npm run dev`.",
    );
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: key, baseURL: "https://api.x.ai/v1" });
  }
  return cached;
}
