// Shared voice rules for writer when seller did NOT give detailed specs (still fun, not corny).
const VOICE_RULES_DEFAULT = `
### Voice rules (STRICT)
- Theatrical but cute: the item is talking in first person, enthusiastic and lively, like a short social clip.
- Current teen internet voice (2026). Lowercase energy is OK in moderation; stay clear when spoken aloud.
- Self-aware humor; avoid sincere "please buy me" with no twist.
- Banned: motivational-poster endings, "I may be used but I still have love to give" energy.
`;

// Tighter voice when seller provided facts — match upbeat resale clip energy.
const VOICE_RULES_WITH_SPECS = `
### Voice rules (with seller specs)
- Enthusiastic, cute, lively — clear voiceover-friendly punctuation.
- Weave in the seller's facts naturally (brand, size, condition, price, care) — do not invent conflicting details.
- Sound like a playful character introduction, not a corporate product listing.
`;

// How the monologue should sound when spoken (writer + video VO) — under 10s ceiling.
const SPEECH_DELIVERY_RULES = `
### Speech delivery (STRICT — must fit a **10 second** clip)
- **Clarity first**: simple everyday words where you can; avoid tongue-twisters, stacked clauses, and cramming facts into one breathless sentence.
- **Reasonable pace**: write so a human could say it **unhurriedly** — short phrases, **commas and periods** where natural pauses belong; never “auctioneer” speed.
- **Time budget**: aim for **~8–9 seconds** of speech at that moderate pace so small pauses still land **inside** the 10 second hard limit.
`;

// Prompt for step 1: analyze the photo(s) and extract structured item attributes.
export function visionPrompt(sellerBlock: string | null, imageCount = 1): string {
  const sellerSection = sellerBlock
    ? `

### Seller-provided hints (use for itemName/price hints when they match the photo; do not contradict visible evidence)
${sellerBlock}
`
    : "";

  const multi =
    imageCount >= 2
      ? `

### Multiple photos
You are given **${imageCount}** photos of the **same physical item** (different angles, distances, or lighting). Merge evidence across all of them: infer true colors, logos, wear, and shape more reliably than from a single view. If one photo is clearer for a detail, prefer it but stay consistent with the others.
`
      : "";

  return `You are the VISION stage of a pipeline for BuyMeMaybe, a second-hand marketplace where items plead for a second life in short video monologues.

Look at the photo${imageCount >= 2 ? "s" : ""} and return a JSON object with structured attributes only — no script yet, no monologue, no fluff.
${multi}

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

  const lengthRule =
    "### Length\n" +
    "**About 24–34 words** (not more). At a clear, moderate speaking rate that must **finish within 10 seconds** of audio — if in doubt, cut words rather than speed up.\n";

  return `You are the WRITER stage of BuyMeMaybe. You write the first-person monologue spoken by the item itself in a short square video.

Item attributes (from the vision stage):
${JSON.stringify(attrs, null, 2)}
${specsSection}
${rules}
${SPEECH_DELIVERY_RULES}

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

// Prompt for step 3: Grok Imagine image-to-video or reference-to-video — square, playful character motion, no giant on-video text.
export function directorPrompt(
  attrs: Record<string, unknown>,
  scriptData: { script: string },
  imageCount = 1,
): string {
  const modeBlock =
    imageCount >= 2
      ? `You are the DIRECTOR stage for BuyMeMaybe. Write ONE paragraph: the **reference-to-video** prompt for Grok Imagine.

The generator receives **${imageCount}** reference stills of the **same item** (different angles). Your \`videoPrompt\` **must** weave in the placeholders **<IMAGE_1>** through **<IMAGE_${imageCount}>** at least once each (xAI convention), tying each to what that view shows (e.g. front print vs side silhouette vs back). Describe coherent motion and 3D-aware behavior using those views together — not separate unrelated scenes.

`
      : `You are the DIRECTOR stage for BuyMeMaybe. Write ONE paragraph: the image-to-video prompt for Grok Imagine. The model sees the uploaded photo plus your text.

`;

  return `${modeBlock}Item attributes: ${JSON.stringify(attrs, null, 2)}
Spoken script (voiceover only — do NOT render this as big on-screen text): "${scriptData.script}"

### Output video (STRICT)
- **10 seconds**, **1:1 square** aspect ratio (not vertical 9:16). Frame should feel balanced, not stretched tall.
- **Spoken audio**: The item’s voiceover must sound **clear and easy to follow** at a **moderate, conversational pace** — not rushed or chipmunk-fast. Mouth motion stays **synced** to that measured speech and the line must **complete comfortably within the 10 second** runtime (no trailing syllables cut off).
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
  // ~300ms/word ≈ moderate clear speech; cap at 10s to match the video VO window.
  const msPerWord = 300;
  const totalMs = Math.min(10_000, Math.max(7500, Math.round(words * msPerWord)));

  return `You are the CAPTIONS stage for BuyMeMaybe. Split the script into **small** on-screen chunks for **optional** burn-in — like subtle subtitles, **not** giant TikTok text.

Script: "${scriptData.script}"

### Rules
- **5 to 9 chunks**, each **2–4 words only** (short phrases).
- Split at natural spoken breaks. Never mid-word.
- Total coverage: 0ms to approximately ${totalMs}ms (~10s video, clear moderate speech). Use ~${msPerWord}ms per word average.
- \`endMs\` of chunk N must equal \`startMs\` of chunk N+1.
- Last chunk's \`endMs\` ≈ ${totalMs}.

Return ONLY this JSON:

{
  "captions": [ { "text": "chunk text", "startMs": 0, "endMs": 800 } ]
}`;
}
