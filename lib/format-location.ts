const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

function expandTrailingStateSegment(segment: string): string {
  const s = segment.trim();
  const m = s.match(/^(.*),\s*([A-Za-z]{2})\s*$/);
  if (!m) return s;
  const [, beforeComma, abbr] = m;
  const full = US_STATE_NAMES[abbr.toUpperCase()];
  if (!full) return s;
  return `${beforeComma.trimEnd()}, ${full}`;
}

export function expandLocationForDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const parts = t.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return t;
  parts[0] = expandTrailingStateSegment(parts[0]);
  return parts.join(" · ");
}

export function formatUsdPrice(amount: number): string {
  if (!Number.isFinite(amount)) return String(amount);
  return Math.abs(amount % 1) > 1e-6 ? amount.toFixed(2) : String(amount);
}
