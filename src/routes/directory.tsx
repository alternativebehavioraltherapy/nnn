import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";
import {
  PAGE_SIZE,
  ZIP_CENTROIDS,
  displaySpecialty,
  formatMiles,
  haversineMiles,
  locationLine,
  matchesSpecialty,
  websiteHref,
  type Provider,
} from "@/data/directory";
import { loadDirectory, type DirectoryPayload } from "@/lib/directory.functions";

export const Route = createFileRoute("/directory")({
  loader: () => loadDirectory({ data: { preview: true } }),
  staleTime: 0,
  head: () => ({
    meta: [{ title: "Directory (beta) — Northwest Neurofeedback Networking" }],
  }),
  errorComponent: DirectoryError,
  component: DirectoryPage,
});

const CEILING_NOTICE =
  "This directory is past the Google Sheet operating limit and needs a database before it grows further.";

function DirectoryError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "The directory could not be loaded.";
  return (
    <PageShell>
      <PageHeader eyebrow="Beta" title="Provider directory" deck={DISCLAIMER} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="rounded-lg border border-line bg-paper p-5 text-ink">{message}</p>
      </div>
    </PageShell>
  );
}

const DISCLAIMER =
  "Beta directory. Listings come from a shared sheet and update when a published row changes. This is a networking list, not a clinic, and not a complete roster or a recommendation.";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`;
}

function DirectoryPage() {
  const initial = Route.useLoaderData();
  const [providers, setProviders] = useState<Provider[]>(initial.providers);
  const [publishedCount, setPublishedCount] = useState(initial.publishedCount);
  const [payloadBytes, setPayloadBytes] = useState(initial.payloadBytes);
  const [overCeiling, setOverCeiling] = useState(initial.overCeiling);
  const [ceilingReasons, setCeilingReasons] = useState(initial.ceilingReasons);
  const [specialties, setSpecialties] = useState(initial.specialties);
  const [complete, setComplete] = useState(initial.publishedCount <= initial.providers.length);
  const [specialty, setSpecialty] = useState("");
  const [zip, setZip] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  function applyPayload(payload: DirectoryPayload, isComplete: boolean) {
    setProviders(payload.providers);
    setPublishedCount(payload.publishedCount);
    setPayloadBytes(payload.payloadBytes);
    setOverCeiling(payload.overCeiling);
    setCeilingReasons(payload.ceilingReasons);
    setSpecialties(payload.specialties);
    setComplete(isComplete);
  }

  useEffect(() => {
    if (complete) return;
    let cancel = false;
    loadDirectory()
      .then((payload) => {
        if (!cancel) applyPayload(payload, true);
      })
      .catch((error: unknown) => {
        if (!cancel) {
          setRefreshError(error instanceof Error ? error.message : "Could not load the full directory.");
        }
      });
    return () => {
      cancel = true;
    };
  }, [complete]);

  const zipCode = zip.replace(/\D/g, "").slice(0, 5);
  const origin = zipCode.length === 5 ? ZIP_CENTROIDS[zipCode] : undefined;
  const zipMiss = zipCode.length === 5 && !origin;

  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [specialty, zipCode]);

  const visible = useMemo(() => {
    const matched = providers.filter((provider) => matchesSpecialty(provider, specialty));
    if (!origin) {
      return matched
        .map((provider) => ({ provider, miles: null as number | null }))
        .sort((a, b) => a.provider.displayName.localeCompare(b.provider.displayName));
    }
    return matched
      .map((provider) => {
        const miles =
          provider.lat != null && provider.lng != null
            ? haversineMiles(origin.lat, origin.lng, provider.lat, provider.lng)
            : null;
        return { provider, miles };
      })
      .sort((a, b) => {
        if (a.miles == null && b.miles == null) {
          return a.provider.displayName.localeCompare(b.provider.displayName);
        }
        if (a.miles == null) return 1;
        if (b.miles == null) return -1;
        return a.miles - b.miles;
      });
  }, [providers, specialty, origin]);

  const page = visible.slice(0, shown);

  async function reload() {
    setRefreshing(true);
    setRefreshError("");
    try {
      const payload = await loadDirectory({ data: { refresh: true } });
      applyPayload(payload, true);
      setShown(PAGE_SIZE);
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Could not reload the directory.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Beta" title="Provider directory" deck={DISCLAIMER} />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {overCeiling ? (
          <p className="mb-4 rounded-lg border border-navy bg-cream px-4 py-3 text-sm text-navy">
            {CEILING_NOTICE}
            {ceilingReasons.length ? ` ${ceilingReasons.join("; ")}.` : null}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
          <label className="block text-sm text-muted">
            Specialty
            <select
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-base text-ink"
            >
              <option value="">All specialties</option>
              {specialties.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted">
            ZIP
            <input
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              placeholder="97201"
              value={zipCode}
              onChange={(event) => setZip(event.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-base text-ink"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={refreshing}
              className="min-h-11 w-full rounded-md border border-navy bg-navy px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-60 sm:w-auto"
            >
              {refreshing ? "Reloading…" : "Reload"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          {origin
            ? `Sorted by approximate distance from ${zipCode}. ZIP centers are rough and incomplete, and a missing map point stays at the end.`
            : zipMiss
              ? `${zipCode} is not in the local ZIP table yet, so the list stays alphabetical.`
              : "Enter a Northwest ZIP to sort by approximate distance. Otherwise the list is alphabetical."}
        </p>
        {refreshError ? <p className="mt-2 text-sm text-navy">{refreshError}</p> : null}

        <p className="mt-6 text-sm text-muted">
          {complete
            ? `${visible.length} published ${visible.length === 1 ? "listing" : "listings"}`
            : `Showing the first ${page.length} of ${publishedCount} published listings`}
          {publishedCount === 0 ? ` The sheet returned 0 published rows (about ${formatBytes(payloadBytes)}).` : null}
        </p>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-paper p-5 text-ink">
            {specialty
              ? "No published listings match that specialty."
              : "No published listings."}
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {page.map(({ provider, miles }) => (
              <li key={provider.id}>
                <ProviderCard provider={provider} miles={miles} />
              </li>
            ))}
          </ul>
        )}

        {shown < visible.length ? (
          <button
            type="button"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
            className="mt-4 min-h-11 rounded-md border border-line bg-paper px-4 py-2.5 text-sm font-medium text-navy"
          >
            Load more
          </button>
        ) : null}
      </div>
    </PageShell>
  );
}

function ProviderCard({ provider, miles }: { provider: Provider; miles: number | null }) {
  const place = locationLine(provider);
  const site = websiteHref(provider.website);
  const phoneHref = provider.phone ? `tel:${provider.phone.replace(/[^\d+]/g, "")}` : "";
  const tags = [...new Set(provider.specialties.map(displaySpecialty))];

  return (
    <article className="rounded-lg border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl text-navy">{provider.displayName}</h2>
        {miles != null ? (
          <p className="text-sm font-medium text-teal-dark">{formatMiles(miles)}</p>
        ) : null}
      </div>
      {provider.credentials ? <p className="mt-1 text-sm text-muted">{provider.credentials}</p> : null}
      {provider.business ? <p className="mt-2 font-medium text-ink">{provider.business}</p> : null}
      {place ? <p className="mt-1 text-sm text-ink">{place}</p> : null}
      {tags.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-teal-dark"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      {provider.shortBio ? <p className="mt-3 text-sm leading-relaxed text-ink">{provider.shortBio}</p> : null}
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {phoneHref ? (
          <a className="text-navy underline decoration-teal underline-offset-2" href={phoneHref}>
            {provider.phone}
          </a>
        ) : null}
        {provider.email ? (
          <a
            className="break-all text-navy underline decoration-teal underline-offset-2"
            href={`mailto:${provider.email}`}
          >
            {provider.email}
          </a>
        ) : null}
        {site ? (
          <a
            className="text-navy underline decoration-teal underline-offset-2"
            href={site}
            target="_blank"
            rel="noreferrer"
          >
            Website
          </a>
        ) : null}
      </p>
    </article>
  );
}
