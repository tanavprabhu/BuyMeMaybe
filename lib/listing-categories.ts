// Seller-picked department on the create form (drives which detail fields are shown).

export const SELLER_CATEGORY_KEYS = ["clothing", "kitchen", "electronics", "decor", "books", "random"] as const;
export type SellerListingCategoryKey = (typeof SELLER_CATEGORY_KEYS)[number];

export type ListingFieldSlot = {
  id: "l1a" | "l1b" | "l2a" | "l2b";
  label: string;
  placeholder: string;
};

export type ListingCategoryFormDef = {
  /** Short label on category pills */
  shortLabel: string;
  line1: [ListingFieldSlot, ListingFieldSlot];
  line2: [ListingFieldSlot, ListingFieldSlot];
};

export const LISTING_CATEGORY_FORMS: Record<SellerListingCategoryKey, ListingCategoryFormDef> = {
  clothing: {
    shortLabel: "Clothing",
    line1: [
      { id: "l1a", label: "Brand", placeholder: "e.g. H&M" },
      { id: "l1b", label: "Type", placeholder: "e.g. Men's tops" },
    ],
    line2: [
      { id: "l2a", label: "Size", placeholder: "e.g. XL" },
      { id: "l2b", label: "Condition", placeholder: "e.g. Like new" },
    ],
  },
  kitchen: {
    shortLabel: "Kitchen",
    line1: [
      { id: "l1a", label: "Brand", placeholder: "e.g. Lodge" },
      { id: "l1b", label: "What is it?", placeholder: "e.g. Cast iron skillet" },
    ],
    line2: [
      { id: "l2a", label: "Condition", placeholder: "e.g. Like new" },
      { id: "l2b", label: "Size / capacity", placeholder: "e.g. 10 inch" },
    ],
  },
  electronics: {
    shortLabel: "Tech",
    line1: [
      { id: "l1a", label: "Brand", placeholder: "e.g. Apple" },
      { id: "l1b", label: "Device type", placeholder: "e.g. Headphones" },
    ],
    line2: [
      { id: "l2a", label: "Model / specs", placeholder: "e.g. AirPods Pro 2" },
      { id: "l2b", label: "Condition", placeholder: "e.g. Light wear" },
    ],
  },
  decor: {
    shortLabel: "Decor",
    line1: [
      { id: "l1a", label: "What is it?", placeholder: "e.g. Table lamp" },
      { id: "l1b", label: "Style", placeholder: "e.g. Mid-century" },
    ],
    line2: [
      { id: "l2a", label: "Condition", placeholder: "e.g. Like new" },
      { id: "l2b", label: "Size", placeholder: "e.g. 18 inch tall" },
    ],
  },
  books: {
    shortLabel: "Books",
    line1: [
      { id: "l1a", label: "Title", placeholder: "e.g. Dune" },
      { id: "l1b", label: "Author / edition", placeholder: "e.g. Frank Herbert, 2021" },
    ],
    line2: [
      { id: "l2a", label: "Condition", placeholder: "e.g. Creased spine" },
      { id: "l2b", label: "Format", placeholder: "e.g. Paperback" },
    ],
  },
  random: {
    shortLabel: "Other",
    line1: [
      { id: "l1a", label: "What is it?", placeholder: "e.g. Board game" },
      { id: "l1b", label: "Brand or maker", placeholder: "e.g. Hasbro" },
    ],
    line2: [
      { id: "l2a", label: "Condition", placeholder: "e.g. Good" },
      { id: "l2b", label: "Notable detail", placeholder: "e.g. Complete in box" },
    ],
  },
};

export function isSellerListingCategoryKey(s: string): s is SellerListingCategoryKey {
  return (SELLER_CATEGORY_KEYS as readonly string[]).includes(s);
}

/** Row labels for the feed quick-facts split of listingLine1 / listingLine2. */
export function quickFactLabelsForSellerCategory(key: string | null | undefined): {
  line1: [string, string];
  line2: [string, string];
} {
  if (key && isSellerListingCategoryKey(key)) {
    const f = LISTING_CATEGORY_FORMS[key];
    return {
      line1: [f.line1[0].label, f.line1[1].label],
      line2: [f.line2[0].label, f.line2[1].label],
    };
  }
  return { line1: ["Brand", "Category"], line2: ["Size", "Condition"] };
}
