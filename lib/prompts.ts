// Shared voice rules for writer when seller did NOT give detailed specs (still fun, not corny).
const VOICE_RULES_DEFAULT = `
### Voice rules (STRICT)
- Theatrical but cute: the item is talking in first person, enthusiastic and lively, like a short social clip.
- Current teen internet voice (2026). Lowercase energy is OK in moderation; stay clear for TTS.
- Self-aware humor; avoid sincere "please buy me" with no twist.
- Banned: motivational-poster endings, "I may be used but I still have love to give" energy.
`;

// Tighter voice when seller provided facts — match upbeat resale clip energy.
const VOICE_RULES_WITH_SPECS = `
### Voice rules (with seller specs)
- Enthusiastic, cute, lively — clear TTS-friendly punctuation.
- Weave in the seller's facts naturally (brand, size, condition, price, care) — do not invent conflicting details.
- Sound like a playful character introduction, not a corporate product listing.
- ~11 seconds spoken (~34–52 words at a brisk pace).
`;

// Prompt for step 1: analyze the photo and extract structured item attributes.
export function visionPrompt(sellerBlock: string | null): string {
  const sellerSection = sellerBlock
    ? `

### Seller-provided hints (use for itemName/price hints when they match the photo; do not contradict visible evidence)
${sellerBlock}
`
    : "";

  return `You are the VISION stage of a pipeline for BuyMeMaybe, a second-hand marketplace where items plead for a second life in short video monologues.

Look at the photo and return a JSON object with structured attributes only — no script yet, no monologue, no fluff.

Return ONLY this JSON (no code fences, no prose):

{
  "itemName": "2–4 word title-case name, e.g. 'Ceramic Coffee Mug'",
  "category": "one of: kitchen | clothing | electronics | decor | books | random",
  "condition": "one of: pristine | lightly used | well-loved | battle-scarred",
  "materials": "short comma list, e.g. 'glazed ceramic, cork'",
  "colors": "short comma list, e.g. 'chocolate brown, cream'",
  "heroFeatures": ["3 to 5 short phrases describing visually distinctive or narratively interesting features"],
  "background": "one sentence describing the setting visible behind the item",
  "askingPrice": integer dollars — realistic second-hand price (most items $3–$40); if seller hinted a price and it fits, prefer that",
  "originalPrice": integer dollars for new, or null if it doesn't apply",
  "urgencyDays": integer 4–62, chosen to feel incidental
}
${sellerSection}

Return the JSON now.`;
}

// Prompt for step 2: write the monologue from the item attributes (and optional seller specs).
export function writerPrompt(
  attrs: Record<string, unknown>,
  sellerBlock: string | null,
): string {
  const rules = sellerBlock ? VOICE_RULES_WITH_SPECS : VOICE_RULES_DEFAULT;
  const specsSection = sellerBlock
    ? `

### Seller-provided facts (MUST appear faithfully in the spoken script)
${sellerBlock}
`
    : "";

  const lengthRule = sellerBlock
    ? "### Length\n34–52 words. Must fit ~11 seconds of voiceover.\n"
    : "### Length\n34–52 words. Must fit ~11 seconds of voiceover.\n";

  return `You are the WRITER stage of BuyMeMaybe. You write the first-person monologue spoken by the item itself in a short square video.

Item attributes (from the vision stage):
${JSON.stringify(attrs, null, 2)}
${specsSection}
${rules}

${lengthRule}
### Structure
- Open with a friendly hook; mention what the item is.
- Include concrete details (condition, size, brand, price) — especially from seller facts when present.
- Close with a light, specific call to grab the deal (not generic begging).

Return ONLY this JSON:

{
  "script": "the full monologue, punctuated as it will be spoken"
}`;
}

// Prompt for step 3: Grok Imagine image-to-video — square, playful character motion, no giant on-video text.
export function directorPrompt(
  attrs: Record<string, unknown>,
  scriptData: { script: string },
): string {
  return `You are the DIRECTOR stage for BuyMeMaybe. Write ONE paragraph: the image-to-video prompt for Grok Imagine. The model sees the uploaded photo plus your text.

Item attributes: ${JSON.stringify(attrs, null, 2)}
Spoken script (voiceover only — do NOT render this as big on-screen text): "${scriptData.script}"

### Output video (STRICT)
- **11 seconds**, **1:1 square** aspect ratio (not vertical 9:16). Frame should feel balanced, not stretched tall.
- **Photorealistic**: keep the item's color, logos, print, texture, and lighting **exact** vs the photo. Do not change the background or printed graphics on the item.
- **Motion**: The item comes alive like a playful animated character — fabric lifts, wrinkles shift, energetic bounce/wiggle/dance; it **moves around the frame** (not stuck center). Sleeves/body move expressively **as fabric** — **no added limbs or human arms**.
- **Face**: Semi-transparent **cartoon** eyes + mouth blended into the item surface (chest/front area appropriate to shape) — cute, expressive, blinking, **mouth motion synced to speech**. Feels part of the shirt/object, not a pasted sticker.
- **Style**: Playful, Disney-like character energy (clearly animated motion, not subtle micro-movement only).
- **NO** large captions, subtitles, or slogan text burned into the video. **NO** filling the frame with typography. Any words are spoken only (off-model).

### Beat hint (adapt to item)
- First ~1s: nearly still / flat, then a punchy "comes alive" moment, then playful motion through the rest.

Return ONLY this JSON:

{
  "videoPrompt": "single paragraph, 90–160 words, English"
}`;
}

// Prompt for step 4: small, subtle lower-third style caption chunks (unused when burn-in captions are disabled).
export function captionsPrompt(scriptData: { script: string }): string {
  const words = scriptData.script.trim().split(/\s+/).filter(Boolean).length;
  const totalMs = Math.min(12_000, Math.max(6000, Math.round(words * 220)));

  return `You are the CAPTIONS stage for BuyMeMaybe. Split the script into **small** on-screen chunks for **optional** burn-in — like subtle subtitles, **not** giant TikTok text.

Script: "${scriptData.script}"

### Rules
- **5 to 9 chunks**, each **2–4 words only** (short phrases).
- Split at natural spoken breaks. Never mid-word.
- Total coverage: 0ms to approximately ${totalMs}ms (~8s speech). Use ~${Math.round(220)}ms per word average.
- \`endMs\` of chunk N must equal \`startMs\` of chunk N+1.
- Last chunk's \`endMs\` ≈ ${totalMs}.

Return ONLY this JSON:

{
  "captions": [ { "text": "chunk text", "startMs": 0, "endMs": 800 } ]
}`;
}
