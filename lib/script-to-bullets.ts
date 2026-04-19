// Turns stored listing script / notes into short, scannable bullet strings for UI.

const MAX_BULLET_LEN = 140;

function trimBullet(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= MAX_BULLET_LEN) return t;
  return `${t.slice(0, MAX_BULLET_LEN - 1).trimEnd()}…`;
}

function splitLongLine(line: string): string[] {
  const t = line.trim();
  if (!t) return [];
  if (t.length <= MAX_BULLET_LEN) return [t];
  // Prefer sentence boundaries inside very long single lines.
  const sentences = t
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (sentences.length > 1) return sentences.flatMap((s) => splitLongLine(s));
  const chunks = t.split(/,\s+/).map((x) => x.trim()).filter((x) => x.length > 6);
  return chunks.length > 1 ? chunks : [trimBullet(t)];
}

function splitBulletMarkers(text: string): string[] {
  const normalized = text.replace(/^[•\-\*]\s*/gm, "• ").replace(/\s*•\s*/g, " • ");
  const parts = normalized
    .split(/\s*•\s*/)
    .map((x) => x.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [];
}

function splitSentences(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;
  return splitLongLine(t);
}

// Converts arbitrary script text into marketplace-style bullet lines.
export function scriptToBullets(script: string): string[] {
  const raw = script.trim();
  if (!raw) return [];

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.flatMap((l) => {
      const marked = splitBulletMarkers(l);
      if (marked.length) return marked.map(trimBullet).filter(Boolean);
      return splitLongLine(l).map(trimBullet).filter(Boolean);
    });
  }

  const single = lines[0] ?? raw;
  const marked = splitBulletMarkers(single);
  if (marked.length) return marked.map(trimBullet).filter(Boolean);

  return splitSentences(single).map(trimBullet).filter(Boolean);
}

// Splits bullets into a primary page (purchase decision) and overflow page.
export function partitionBullets(bullets: string[], primaryMax: number): { primary: string[]; extra: string[] } {
  if (bullets.length <= primaryMax) return { primary: bullets, extra: [] };
  return {
    primary: bullets.slice(0, primaryMax),
    extra: bullets.slice(primaryMax),
  };
}
