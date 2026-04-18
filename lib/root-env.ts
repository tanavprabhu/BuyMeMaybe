import { loadEnvConfig } from "@next/env";

let loaded = false;

// Loads `.env` and `.env.local` from the project root into `process.env` (Next-compatible order).
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  loadEnvConfig(process.cwd());
}
