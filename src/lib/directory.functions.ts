import { createServerFn } from "@tanstack/react-start";
import {
  CACHE_TTL_MS,
  FETCH_TIMEOUT_MS,
  MAX_CSV_BYTES,
  MAX_PUBLISHED_ROWS,
  PAGE_SIZE,
  SHEET_CSV_URL,
  providersFromCsv,
  specialtyChoices,
  type Provider,
} from "@/data/directory";

export type DirectoryPayload = {
  providers: Provider[];
  publishedCount: number;
  payloadBytes: number;
  overCeiling: boolean;
  ceilingReasons: string[];
  specialties: string[];
  fetchMs: number;
};

type CacheEntry = {
  providers: Provider[];
  payloadBytes: number;
  fetchedAt: number;
  fetchMs: number;
};

let memory: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

const CEILING_NOTICE =
  "This directory is past the Google Sheet operating limit and needs a database before it grows further.";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

function byName(a: Provider, b: Provider): number {
  return a.displayName.localeCompare(b.displayName);
}

function validateInput(input: unknown): { refresh: boolean; preview: boolean } {
  if (!input || typeof input !== "object") return { refresh: false, preview: false };
  const record = input as { refresh?: unknown; preview?: unknown };
  return { refresh: record.refresh === true, preview: record.preview === true };
}

function ceilingReasons(entry: CacheEntry): string[] {
  const reasons: string[] = [];
  if (entry.providers.length > MAX_PUBLISHED_ROWS) {
    reasons.push(`${entry.providers.length.toLocaleString()} published rows (limit ${MAX_PUBLISHED_ROWS.toLocaleString()})`);
  }
  if (entry.payloadBytes > MAX_CSV_BYTES) {
    reasons.push(`sheet export is ${formatBytes(entry.payloadBytes)} (limit 5 MB)`);
  }
  if (entry.fetchMs >= FETCH_TIMEOUT_MS) {
    reasons.push(`sheet took ${Math.ceil(entry.fetchMs / 1000)} seconds to answer (limit 8 seconds)`);
  }
  return reasons;
}

async function fetchSheet(): Promise<CacheEntry> {
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(SHEET_CSV_URL, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      console.error("Directory sheet exceeded the 8 second operating limit.");
      throw new Error(
        `The directory sheet took longer than 8 seconds. ${CEILING_NOTICE}`,
      );
    }
    console.error("Directory sheet fetch failed.", error);
    throw new Error("The directory sheet could not be read.");
  }

  const fetchMs = Date.now() - started;
  if (!response.ok) {
    console.error(`Directory sheet responded ${response.status}.`);
    throw new Error(`The directory sheet could not be read (${response.status}).`);
  }

  const body = await response.text();
  const payloadBytes = new TextEncoder().encode(body).byteLength;
  if (body.trimStart().startsWith("<")) {
    console.error(`Directory sheet returned HTML instead of CSV (${payloadBytes} bytes).`);
    throw new Error("The sheet is not publicly readable. Share it as “anyone with the link can view.”");
  }

  const providers = providersFromCsv(body);
  if (providers.length === 0) {
    console.info(`Directory sheet returned 0 published rows (${payloadBytes} bytes).`);
  }

  return { providers, payloadBytes, fetchedAt: Date.now(), fetchMs };
}

/** Cache hit does not call Google. Failures are not cached. */
async function readDirectory(refresh: boolean): Promise<CacheEntry> {
  if (!refresh && memory && Date.now() - memory.fetchedAt < CACHE_TTL_MS) {
    return memory;
  }
  if (!refresh && inflight) return inflight;

  const run = fetchSheet()
    .then((entry) => {
      memory = entry;
      return entry;
    })
    .finally(() => {
      if (inflight === run) inflight = null;
    });

  if (!refresh) inflight = run;
  return run;
}

/** Reads published rows from the sheet CSV. Pass preview to omit all but the first page. */
export const loadDirectory = createServerFn({ method: "GET" })
  .validator(validateInput)
  .handler(async ({ data }): Promise<DirectoryPayload> => {
    const entry = await readDirectory(data.refresh);
    const reasons = ceilingReasons(entry);
    const ordered = [...entry.providers].sort(byName);
    return {
      providers: data.preview ? ordered.slice(0, PAGE_SIZE) : ordered,
      publishedCount: entry.providers.length,
      payloadBytes: entry.payloadBytes,
      overCeiling: reasons.length > 0,
      ceilingReasons: reasons,
      specialties: specialtyChoices(entry.providers),
      fetchMs: entry.fetchMs,
    };
  });
