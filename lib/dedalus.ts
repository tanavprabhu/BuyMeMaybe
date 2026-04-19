import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const DEDALUS_LABS_URL = "https://www.dedaluslabs.ai/";

export function isDedalusMachineHookEnabled(): boolean {
  return Boolean(process.env.DEDALUS_MACHINE_ID?.trim());
}

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
