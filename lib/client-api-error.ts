// Parses a failed fetch Response body into a single user-facing message string.
export async function messageFromFailedResponse(res: Response): Promise<string> {
  const text = (await res.text()).trim();
  if (!text) return `Something went wrong (${res.status}).`;
  try {
    const j = JSON.parse(text) as { error?: unknown };
    if (typeof j.error === "string") return j.error;
  } catch {
    /* plain text */
  }
  return text;
}

// Rewrites provider-specific errors into short, actionable copy for the UI.
export function friendlyApiMessage(raw: string): string {
  const t = raw.trim();
  if (/^402\b/i.test(t) || /out of credits|top up to continue|insufficient.*credit/i.test(t)) {
    return "Your xAI account needs credits or a valid API key. Check console.x.ai billing and XAI_API_KEY, then try again.";
  }
  if (/XAI_API_KEY|API_KEY is missing/i.test(t)) {
    return "API key missing. Add XAI_API_KEY to .env or .env.local and restart the dev server.";
  }
  return t;
}
