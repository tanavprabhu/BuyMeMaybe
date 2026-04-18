// Seller-entered hints shown on the create page to steer vision, script, and video.
export type SellerListingSpecs = {
  titleLine: string;
  detailLine: string;
  extra: string;
  askingPriceInput: string;
};

// Returns true when any spec field has non-whitespace content.
export function hasSellerSpecs(s: SellerListingSpecs): boolean {
  return (
    s.titleLine.trim().length > 0 ||
    s.detailLine.trim().length > 0 ||
    s.extra.trim().length > 0 ||
    s.askingPriceInput.trim().length > 0
  );
}

// Builds a compact block for LLM prompts, or null if empty.
export function sellerSpecsPromptBlock(s: SellerListingSpecs): string | null {
  if (!hasSellerSpecs(s)) return null;
  const lines: string[] = [];
  if (s.titleLine.trim()) lines.push(`Listing line 1 (e.g. brand · category): ${s.titleLine.trim()}`);
  if (s.detailLine.trim()) lines.push(`Listing line 2 (e.g. size · condition): ${s.detailLine.trim()}`);
  if (s.extra.trim()) lines.push(`Extra facts for the voiceover (brand, size, price, care, etc.): ${s.extra.trim()}`);
  if (s.askingPriceInput.trim()) lines.push(`Asking price (seller intent): ${s.askingPriceInput.trim()}`);
  return lines.join("\n");
}

// Parses a dollar amount from messy user input, or returns null.
export function parseAskingPriceUsd(raw: string): number | null {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 50000) return null;
  return n;
}
