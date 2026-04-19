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

export function friendlyApiMessage(raw: string): string {
  const t = raw.trim();
  if (/^402\b/i.test(t) || /out of credits|top up to continue|insufficient.*credit/i.test(t)) {
    return "Your xAI account needs credits or a valid API key. Check console.x.ai billing and XAI_API_KEY, then try again.";
  }
  if (/XAI_API_KEY|API_KEY is missing|XAI_API_KEY is not set for this deployment/i.test(t)) {
    return (
      "The server is missing the xAI API key. If you run the site online: add XAI_API_KEY in your host’s " +
      "environment variables (Vercel → Project → Settings → Environment Variables → Production), then redeploy. " +
      "Locally: put it in .env.local and restart npm run dev."
    );
  }
  return t;
}
