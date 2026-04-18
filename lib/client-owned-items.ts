const STORAGE_KEY = "buymemaybe.myItemIds";

// Reads locally-owned listing ids from browser storage.
export function readMyItemIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

// Persists locally-owned listing ids to browser storage.
export function writeMyItemIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

// Marks an item id as locally-owned by this browser/user.
export function addMyItemId(id: string): void {
  const ids = readMyItemIds();
  ids.add(id);
  writeMyItemIds(ids);
}

// Unmarks an item id from locally-owned ids.
export function removeMyItemId(id: string): void {
  const ids = readMyItemIds();
  ids.delete(id);
  writeMyItemIds(ids);
}
