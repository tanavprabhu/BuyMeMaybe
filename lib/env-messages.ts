/** Shown when XAI_API_KEY is unset (server throws, client may rephrase via friendlyApiMessage). */
export function missingXaiApiKeyMessage(): string {
  const onVercel = process.env.VERCEL === "1";
  const prod = process.env.NODE_ENV === "production";
  if (onVercel || prod) {
    return (
      "XAI_API_KEY is not set for this deployment. In Vercel: open the project → Settings → Environment Variables → " +
      "add XAI_API_KEY (value from console.x.ai) for Production, save, then trigger a new deployment. " +
      "Add the same variable for Preview if you use preview URLs."
    );
  }
  return (
    "XAI_API_KEY is missing. Add it to .env or .env.local in the project root, then restart `npm run dev`."
  );
}
