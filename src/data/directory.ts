/**
 * Provider directory source.
 *
 * The site reads the Google Sheet on each visit. To switch the fetch to a
 * deployed Apps Script web app, paste its URL into DIRECTORY_SCRIPT_URL.
 * Leave it empty to keep using the sheet CSV export (sheet must stay
 * viewable by anyone with the link).
 *
 * Specialty list: SPECIALTIES is the initial dropdown. Values that appear
 * in the sheet but are not in that list are added automatically, so the
 * filter can grow without a code change. Known typos are mapped in ALIASES.
 */

export const SHEET_ID = "1ozYyjSQgc3jYDwvYpu-LT1kmcuZ_IvzC82lyKWiKd4E";

/** Paste the deployed Apps Script /exec URL here when you have one. */
export const DIRECTORY_SCRIPT_URL = "";

export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

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
  lat: number | null;
  lng: number | null;
  address: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  shortBio: string;
};

/** Approximate centroids for Northwest ZIP search. Not a full geocoder. */
export const ZIP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "97003": { lat: 45.547, lng: -122.964 },
  "97005": { lat: 45.487, lng: -122.81 },
  "97006": { lat: 45.531, lng: -122.829 },
  "97007": { lat: 45.452, lng: -122.858 },
  "97008": { lat: 45.456, lng: -122.8 },
  "97015": { lat: 45.432, lng: -122.641 },
  "97027": { lat: 45.366, lng: -122.612 },
  "97030": { lat: 45.505, lng: -122.431 },
  "97034": { lat: 45.412, lng: -122.7 },
  "97035": { lat: 45.42, lng: -122.72 },
  "97045": { lat: 45.357, lng: -122.607 },
  "97062": { lat: 45.384, lng: -122.764 },
  "97068": { lat: 45.358, lng: -122.661 },
  "97070": { lat: 45.381, lng: -122.605 },
  "97080": { lat: 45.498, lng: -122.431 },
  "97086": { lat: 45.44, lng: -122.564 },
  "97123": { lat: 45.522, lng: -122.989 },
  "97124": { lat: 45.505, lng: -122.896 },
  "97132": { lat: 45.3, lng: -122.973 },
  "97140": { lat: 45.356, lng: -122.84 },
  "97201": { lat: 45.508, lng: -122.689 },
  "97202": { lat: 45.484, lng: -122.639 },
  "97203": { lat: 45.605, lng: -122.743 },
  "97204": { lat: 45.518, lng: -122.676 },
  "97205": { lat: 45.522, lng: -122.691 },
  "97206": { lat: 45.482, lng: -122.596 },
  "97209": { lat: 45.529, lng: -122.685 },
  "97210": { lat: 45.532, lng: -122.706 },
  "97211": { lat: 45.568, lng: -122.642 },
  "97212": { lat: 45.542, lng: -122.643 },
  "97213": { lat: 45.537, lng: -122.599 },
  "97214": { lat: 45.513, lng: -122.644 },
  "97215": { lat: 45.516, lng: -122.602 },
  "97216": { lat: 45.513, lng: -122.564 },
  "97217": { lat: 45.573, lng: -122.688 },
  "97218": { lat: 45.576, lng: -122.611 },
  "97219": { lat: 45.447, lng: -122.706 },
  "97220": { lat: 45.554, lng: -122.562 },
  "97221": { lat: 45.496, lng: -122.736 },
  "97222": { lat: 45.446, lng: -122.639 },
  "97223": { lat: 45.438, lng: -122.77 },
  "97224": { lat: 45.394, lng: -122.764 },
  "97225": { lat: 45.498, lng: -122.766 },
  "97227": { lat: 45.544, lng: -122.675 },
  "97229": { lat: 45.556, lng: -122.808 },
  "97230": { lat: 45.545, lng: -122.507 },
  "97232": { lat: 45.526, lng: -122.65 },
  "97233": { lat: 45.515, lng: -122.493 },
  "97236": { lat: 45.476, lng: -122.51 },
  "97239": { lat: 45.485, lng: -122.694 },
  "97266": { lat: 45.482, lng: -122.558 },
  "98604": { lat: 45.781, lng: -122.534 },
  "98607": { lat: 45.587, lng: -122.402 },
  "98642": { lat: 45.815, lng: -122.743 },
  "98660": { lat: 45.639, lng: -122.661 },
  "98661": { lat: 45.628, lng: -122.65 },
  "98662": { lat: 45.652, lng: -122.57 },
  "98663": { lat: 45.675, lng: -122.671 },
  "98664": { lat: 45.62, lng: -122.58 },
  "98665": { lat: 45.68, lng: -122.66 },
  "98671": { lat: 45.58, lng: -122.353 },
  "98682": { lat: 45.67, lng: -122.52 },
  "98683": { lat: 45.61, lng: -122.51 },
  "98684": { lat: 45.61, lng: -122.55 },
  "98685": { lat: 45.7, lng: -122.67 },
  "98686": { lat: 45.72, lng: -122.65 },
};

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

function coord(value: unknown): number | null {
  const text = cell(value);
  if (!text || text === "—" || text === "-") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function providerFromRecord(record: Record<string, unknown>): Provider | null {
  const status = cell(record.status).toLowerCase();
  if (status && status !== "published") return null;
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
    zip: cell(record.zip),
    lat: coord(record.lat),
    lng: coord(record.lng),
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
