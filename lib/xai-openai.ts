import OpenAI from "openai";
import { missingXaiApiKeyMessage } from "./env-messages";
import { loadRootEnv } from "./root-env";

let cached: OpenAI | null = null;

export function getXaiOpenAI(): OpenAI {
  loadRootEnv();
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new Error(missingXaiApiKeyMessage());
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: key, baseURL: "https://api.x.ai/v1" });
  }
  return cached;
}
