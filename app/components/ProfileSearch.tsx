"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search, X } from "lucide-react";

type SearchUser = {
  id: string;
  ownerName: string;
  slug: string;
  bio: string | null;
  followerCount: number;
  postCount: number;
};

export function ProfileSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  function resultLinks() {
    return Array.from(resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
  }

  function handlePanelKeyDown(event: ReactKeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = resultLinks();
    if (!links.length) return;
    event.preventDefault();
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? links.length - 1
          : event.key === "ArrowDown"
            ? currentIndex < 0 ? 0 : (currentIndex + 1) % links.length
            : currentIndex < 0 ? links.length - 1 : (currentIndex - 1 + links.length) % links.length;
    links[nextIndex]?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideInteraction(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!open || query.trim().length < 2) {
      setUsers([]);
      setLoading(false);
      setSearchError(false);
      return;
    }

    const controller = new AbortController();
    timer.current = setTimeout(async () => {
      setLoading(true);
      setSearchError(false);
      try {
        const res = await fetch(
          `/api/profiles/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => ({}));
        setUsers(res.ok ? data.users || [] : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setUsers([]);
          setSearchError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      controller.abort();
    };
  }, [open, query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-testid="profile-search-trigger"
        aria-label="Kişi ara"
        title="Kişi ara"
        aria-expanded={open}
        aria-controls="profile-search-panel"
        onClick={() => setOpen((current) => !current)}
        className="topbar-icon-button"
      >
        <Search size={18} aria-hidden="true" />
      </button>

      {open && (
        <section
          id="profile-search-panel"
          role="search"
          onKeyDown={handlePanelKeyDown}
          className="sticky-panel absolute right-0 top-full z-40 mt-3 w-[min(420px,calc(100vw-32px))] rounded-2xl p-3"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
            <div>
              <label className="sr-only" htmlFor="profile-search-input">Kullanıcı ara</label>
              <input
                ref={inputRef}
                id="profile-search-input"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kullanıcı adı ara..."
                className="h-11 w-full rounded-xl border border-white/16 bg-white/95 px-4 text-sm text-slate-950 outline-none focus:border-cyan-300"
              />
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
              className="toast-close h-10 w-10"
              aria-label="Aramayı kapat"
              title="Kapat"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          <div ref={resultsRef} className="mt-2 max-h-[420px] overflow-y-auto" aria-live="polite">
            {query.trim().length < 2 && (
              <p className="rounded-xl px-3 py-4 text-sm text-cyan-50/76">En az iki karakter yaz.</p>
            )}
            {loading && <p className="rounded-xl px-3 py-4 text-sm text-cyan-50/76">Aranıyor...</p>}
            {!loading && searchError && (
              <p className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-4 text-sm text-rose-100">
                Arama hizmetine ulaşılamadı. Biraz sonra tekrar dene.
              </p>
            )}
            {!loading && !searchError && query.trim().length >= 2 && users.length === 0 && (
              <p className="rounded-xl px-3 py-4 text-sm text-cyan-50/76">Kullanıcı bulunamadı.</p>
            )}
            {!loading && !searchError && users.map((user) => (
              <Link
                key={user.id}
                href={`/u/${user.slug}`}
                onClick={() => setOpen(false)}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                <span className="nav-avatar h-10 w-10">{user.ownerName.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{user.ownerName}</span>
                  <span className="mt-0.5 block truncate text-xs text-cyan-50/74">{user.bio || `@${user.slug}`}</span>
                </span>
                <span className="text-right text-xs font-bold text-cyan-50/72">
                  {user.followerCount} takipçi<br />{user.postCount} paylaşım
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
