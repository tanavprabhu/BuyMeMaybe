import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Product site for [Dedalus Labs](https://www.dedaluslabs.ai/) persistent agent sandboxes. */
export const DEDALUS_LABS_URL = "https://www.dedaluslabs.ai/";

/** True when a Dedalus Machine id is configured (CLI hooks may run). */
export function isDedalusMachineHookEnabled(): boolean {
  return Boolean(process.env.DEDALUS_MACHINE_ID?.trim());
}

// Best-effort `dedalus machines exec` — never throws; failures are logged only.
async function pingDedalusMachine(context: string): Promise<void> {
  const id = process.env.DEDALUS_MACHINE_ID?.trim();
  if (!id) return;
  try {
    await execFileAsync(
      "dedalus",
      ["machines", "exec", "--machine-id", id, "--", "sh", "-c", "exit 0"],
      { timeout: 8000, env: process.env },
    );
    console.log(`  [dedalus] ${context} (${id})`);
  } catch {
    console.warn(
      `  [dedalus] skipped ${context} — install CLI (\`brew install dedalus-labs/tap/dedalus\`) and set DEDALUS_API_KEY; see ${DEDALUS_LABS_URL}`,
    );
  }
}

/**
 * When `DEDALUS_MACHINE_ID` is set, pings the Dedalus Machine before/after `job`.
 * When unset, runs `job` only — same behavior as before this hook existed.
 */
export async function withDedalusMachineHooks<T>(label: string, job: () => Promise<T>): Promise<T> {
  if (!isDedalusMachineHookEnabled()) {
    return job();
  }
  await pingDedalusMachine(`before ${label}`);
  try {
    return await job();
  } finally {
    await pingDedalusMachine(`after ${label}`);
  }
}
