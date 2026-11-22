/**
 * Provider directory source. The live read is the public Google Sheet CSV.
 * Apps Script is not on the request path.
 *
 * No lat/lng. Distance is ZIP centroid to ZIP centroid. The sheet may still
 * contain lat/lng columns; they are ignored.
 *
 * Hard stop for this design: 5,000 published rows, a 5 MB CSV, or a cold
 * fetch over 8 seconds. Past that, stop stretching Sheets. The next system
 * is Postgres, with the sheet as an import source only — not the live read.
 *
 * ZIP_CENTROIDS is an approximate Northwest table (OR, WA, ID, and the nearby
 * border), not a geocoder and not a street address. A ZIP outside that region
 * does not sort. SPECIALTIES is the initial dropdown. Values in the sheet that
 * are not in that list are added automatically. Known typos are mapped in ALIASES.
 */

export const SHEET_ID = "1ozYyjSQgc3jYDwvYpu-LT1kmcuZ_IvzC82lyKWiKd4E";

export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

/** Cards rendered at a time. The rest stay in memory until "Load more". */
export const PAGE_SIZE = 40;

/** In-memory cache of the parsed sheet. Not a substitute for route staleTime. */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/** Operating ceiling. Google can store more; this design should not. */
export const MAX_PUBLISHED_ROWS = 5000;
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 8000;

/** Initial controlled vocabulary. New sheet values still show up in the filter. */
export const SPECIALTIES = [
  "Remote",
  "Infra-Low",
  "Infra-Slow",
  "Multi-Coherence Variability",
  "NeurOptimal",
  "HEG/fNIRs",
  "Synchrony",
  "Alpha-Theta",
  "Amplitude training",
  "LENS",
  "BrainPaint",
] as const;

const ALIASES: Record<string, string> = {
  synchonry: "synchrony",
  "brian paint": "brainpaint",
  "brain paint": "brainpaint",
};

export type Provider = {
  id: string;
  displayName: string;
  credentials: string;
  business: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  shortBio: string;
};

/** Approximate ZIP centers. See zip-centroids.ts. Not a street address. */
export { ZIP_CENTROIDS } from "@/data/zip-centroids";

export function canonSpecialty(value: string): string {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key] ?? key;
}

export function displaySpecialty(value: string): string {
  const canon = canonSpecialty(value);
  return SPECIALTIES.find((item) => canonSpecialty(item) === canon) ?? value.trim();
}

export function specialtyChoices(providers: Provider[]): string[] {
  const extras: string[] = [];
  const seen = new Set(SPECIALTIES.map((item) => canonSpecialty(item)));
  for (const provider of providers) {
    for (const raw of provider.specialties) {
      const label = displaySpecialty(raw);
      const key = canonSpecialty(label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      extras.push(label);
    }
  }
  extras.sort((a, b) => a.localeCompare(b));
  return [...SPECIALTIES, ...extras];
}

export function matchesSpecialty(provider: Provider, selected: string): boolean {
  if (!selected) return true;
  const want = canonSpecialty(selected);
  return provider.specialties.some((item) => canonSpecialty(item) === want);
}

export function locationLine(provider: Provider): string {
  if (provider.address) {
    const place = [provider.city, provider.state, provider.zip].filter(Boolean).join(", ");
    return place && !provider.address.includes(provider.zip) ? `${provider.address}, ${place}` : provider.address;
  }
  return [provider.city, provider.state, provider.zip].filter(Boolean).join(", ");
}

export function websiteHref(website: string): string {
  const value = website.trim();
  if (!value || value === "—" || value === "-") return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function cell(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function zipDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function providerFromRecord(record: Record<string, unknown>): Provider | null {
  const status = cell(record.status).toLowerCase();
  if (status !== "published") return null;
  const displayName = cell(record.display_name);
  if (!displayName) return null;
  const id = cell(record.id) || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id,
    displayName,
    credentials: cell(record.credentials),
    business: cell(record.business),
    city: cell(record.city),
    state: cell(record.state),
    zip: zipDigits(cell(record.zip)),
    address: cell(record.address),
    phone: cell(record.phone),
    email: cell(record.email),
    website: cell(record.website),
    specialties: cell(record.specialties)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    shortBio: cell(record.short_bio),
  };
}

export function providersFromRecords(records: unknown): Provider[] {
  if (!Array.isArray(records)) {
    throw new Error("Directory data was not a list.");
  }
  return records.flatMap((record) => {
    if (!record || typeof record !== "object") return [];
    const provider = providerFromRecord(record as Record<string, unknown>);
    return provider ? [provider] : [];
  });
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cellText = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cellText += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cellText += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cellText);
      cellText = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cellText);
      cellText = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cellText += char;
    }
  }
  if (cellText.length || row.length) {
    row.push(cellText);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  return rows;
}

export function providersFromCsv(csv: string): Provider[] {
  const table = parseCsv(csv);
  if (table.length < 2) return [];
  const headers = table[0].map((header) => header.trim());
  return table.slice(1).flatMap((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index] ?? "";
    });
    const provider = providerFromRecord(record);
    return provider ? [provider] : [];
  });
}
