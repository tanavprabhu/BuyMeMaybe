export type SellerListingSpecs = {
  titleLine: string;
  detailLine: string;
  extra: string;
  askingPriceInput: string;
  sellerCategoryKey?: string;
};

export function hasSellerSpecs(s: SellerListingSpecs): boolean {
  return (
    s.titleLine.trim().length > 0 ||
    s.detailLine.trim().length > 0 ||
    s.extra.trim().length > 0 ||
    s.askingPriceInput.trim().length > 0
  );
}

export function sellerSpecsPromptBlock(s: SellerListingSpecs): string | null {
  if (!hasSellerSpecs(s)) return null;
  const lines: string[] = [];
  if (s.sellerCategoryKey?.trim()) {
    lines.push(`Seller listing department: ${s.sellerCategoryKey.trim()}`);
  }
  if (s.titleLine.trim()) lines.push(`Listing line 1 (structured facts): ${s.titleLine.trim()}`);
  if (s.detailLine.trim()) lines.push(`Listing line 2 (structured facts): ${s.detailLine.trim()}`);
  if (s.extra.trim()) lines.push(`Extra facts for the voiceover (brand, size, price, care, etc.): ${s.extra.trim()}`);
  if (s.askingPriceInput.trim()) lines.push(`Asking price (seller intent): ${s.askingPriceInput.trim()}`);
  return lines.join("\n");
}

export function parseAskingPriceUsd(raw: string): number | null {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 50000) return null;
  return n;
}
