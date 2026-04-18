import OpenAI from "openai";

// Lazily builds an OpenAI-compatible client pointed at Dedalus, which routes our xAI calls.
export function getDedalus(): OpenAI {
  const key = process.env.DEDALUS_API_KEY;
  if (!key) throw new Error("DEDALUS_API_KEY is not set in .env.local");
  return new OpenAI({ apiKey: key, baseURL: "https://api.dedaluslabs.ai/v1" });
}
