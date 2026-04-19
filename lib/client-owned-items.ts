const STORAGE_KEY = "buymemaybe.myItemIds";

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

export function writeMyItemIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export function addMyItemId(id: string): void {
  const ids = readMyItemIds();
  ids.add(id);
  writeMyItemIds(ids);
}

export function removeMyItemId(id: string): void {
  const ids = readMyItemIds();
  ids.delete(id);
  writeMyItemIds(ids);
}
