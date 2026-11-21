import { createServerFn } from "@tanstack/react-start";
import {
  DIRECTORY_SCRIPT_URL,
  SHEET_CSV_URL,
  providersFromCsv,
  providersFromRecords,
  type Provider,
} from "@/data/directory";

/** Reads published rows from the sheet (or the Apps Script URL, if set). */
export const loadDirectory = createServerFn({ method: "GET" }).handler(async (): Promise<Provider[]> => {
  const scriptUrl = DIRECTORY_SCRIPT_URL.trim();
  const url = scriptUrl || SHEET_CSV_URL;
  const response = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`The directory sheet could not be read (${response.status}).`);
  }
  const body = await response.text();
  if (scriptUrl) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error("The directory script did not return JSON.");
    }
    const records = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { providers?: unknown }).providers)
        ? (parsed as { providers: unknown[] }).providers
        : null;
    if (!records) throw new Error("The directory script did not return a list.");
    return providersFromRecords(records);
  }
  if (body.trimStart().startsWith("<")) {
    throw new Error("The sheet is not publicly readable. Share it as “anyone with the link can view.”");
  }
  return providersFromCsv(body);
});
