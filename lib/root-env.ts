import { loadEnvConfig } from "@next/env";

let loaded = false;

export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;
  loadEnvConfig(process.cwd());
}
