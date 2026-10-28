import { communityNavigationFromParams } from "./communityNavigation.ts";

export function draftHistoryScope(currentHref: string, nextHref: string): "none" | "local" | "page" {
  const current = new URL(currentHref), next = new URL(nextHref);
  if (current.origin !== next.origin) return "none";
  if (current.pathname === next.pathname && current.search === next.search) return "none";
  if (current.pathname === next.pathname && /^\/communities\/[^/]+\/?$/u.test(current.pathname)) {
    const from = { ...communityNavigationFromParams(current.searchParams), commentPage: 1 };
    const to = { ...communityNavigationFromParams(next.searchParams), commentPage: 1 };
    return JSON.stringify(from) === JSON.stringify(to) ? "none" : "local";
  }
  return "page";
}

type Entry = { key: string; index: number; url: string | null; sameDocument: boolean };
export type DraftHistoryNavigation = EventTarget & { currentEntry: Entry | null; entries: () => Entry[] };
type HistoryHost = Pick<Window, "history" | "addEventListener" | "removeEventListener">;

/** Park a traversal before Next/popstate consumers see it; never write history state. */
export function installDraftHistoryGuard(host: HistoryHost, navigation: DraftHistoryNavigation,
  blocked: (local: boolean) => boolean, request: (proceed: () => void, local: boolean) => void) {
  let active = navigation.currentEntry;
  let pending: { entry: Entry; local: boolean } | null = null;
  let replay: string | null = null;
  const changed = (event: Event) => {
    if (!pending && (event as Event & { navigationType?: string }).navigationType !== "traverse") {
      active = navigation.currentEntry;
    }
  };
  const pop = (event: PopStateEvent) => {
    const entry = navigation.currentEntry;
    if (!entry || !active || !entry.url || !active.url || !entry.sameDocument) return;
    if (replay === entry.key) { replay = null; active = entry; return; }
    replay = null;
    if (pending) {
      event.stopImmediatePropagation();
      if (entry.key !== active.key) {
        // A rapid second traversal can supersede the browser's queued restoration.
        host.history.go(active.index - entry.index);
        return;
      }
      const target = pending; pending = null;
      request(() => {
        const destination = navigation.entries().find(value => value.key === target.entry.key);
        const current = navigation.currentEntry;
        if (!destination || !current || !destination.sameDocument || destination.key === current.key) return;
        replay = destination.key;
        host.history.go(destination.index - current.index);
      }, target.local);
      return;
    }
    const scope = draftHistoryScope(active.url, entry.url);
    if (scope === "none" || !blocked(scope === "local")) { active = entry; return; }
    if (entry.index === active.index) { active = entry; return; }
    event.stopImmediatePropagation();
    pending = { entry, local: scope === "local" };
    host.history.go(active.index - entry.index);
  };
  navigation.addEventListener("currententrychange", changed);
  const capture = { capture: true };
  host.addEventListener("popstate", pop, capture);
  return () => {
    navigation.removeEventListener("currententrychange", changed);
    host.removeEventListener("popstate", pop, capture);
  };
}
