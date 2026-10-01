// Links created in this browser, persisted to localStorage so they survive
// navigating to /stats/[code] and back, or reloading/closing the tab. There's
// no "list all links" backend endpoint, so this is client-only — it won't
// show links created on a different device or browser.
//
// Exposed via the useSyncExternalStore contract (subscribe/getSnapshot/
// getServerSnapshot) so React components can read it without a manual
// useState+useEffect dance, and without hydration mismatches (SSR always
// sees an empty list, since localStorage doesn't exist on the server).

export type LinkEntry = { code: string; shortUrl: string; longUrl: string };

const STORAGE_KEY = "shortly:links";
const CHANGE_EVENT = "shortly:links-changed";

let cachedRaw: string | null = null;
let cachedLinks: LinkEntry[] = [];

function parse(raw: string | null): LinkEntry[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LinkEntry[];
  } catch {
    return [];
  }
}

function persist(links: LinkEntry[]) {
  const raw = JSON.stringify(links);
  cachedRaw = raw;
  cachedLinks = links;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // storage full or unavailable (e.g. private browsing) — in-memory value
    // still works for this tab via the module-level cache above
  }
  // The native "storage" event only fires in *other* tabs; dispatch our own
  // so this tab's subscribers (i.e. this same render) re-read immediately.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getSnapshot(): LinkEntry[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  // Only re-parse (and return a new array reference) when the underlying
  // string actually changed — useSyncExternalStore requires a stable
  // reference across calls when nothing changed, or it will re-render forever.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLinks = parse(raw);
  }
  return cachedLinks;
}

export function getServerSnapshot(): LinkEntry[] {
  return [];
}

export function addLink(link: LinkEntry) {
  const current = getSnapshot();
  if (current.some((existing) => existing.code === link.code)) return;
  persist([link, ...current]);
}

export function clearLinks() {
  persist([]);
}
