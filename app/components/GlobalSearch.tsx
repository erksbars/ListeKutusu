"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { searchPath, searchQuery, type SocialSearchResult } from "@/lib/socialSearchTypes";
import { useDraftNavigationRequest } from "./DraftNavigationProvider";
import styles from "./SocialSearch.module.css";

export function GlobalSearch() {
  const params = useSearchParams(), pathname = usePathname(), router = useRouter();
  const requestNavigation = useDraftNavigationRequest();
  const currentQuery = pathname === "/search" ? params.get("q") ?? "" : "";
  const [value, setValue] = useState(currentQuery);
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const [result, setResult] = useState<SocialSearchResult | null>(null);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null), listId = useId();
  const q = searchQuery(value);
  useEffect(() => { setValue(currentQuery); setOpen(false); setActive(-1); }, [currentQuery, pathname]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    setResult(null); setFailed(false); setActive(-1);
    if (q.length < 2 || !open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/social-search?${new URLSearchParams({ q, preview: "1" })}`, { signal: controller.signal, cache: "no-store" })
        .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<SocialSearchResult>; })
        .then(data => { if (!controller.signal.aborted && data.query === q) setResult(data); })
        .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    }, 280);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, open]);
  const suggestions = result?.query === q ? [...result.communities.map(item => ({ ...item, category: "Topluluk" })), ...result.people.map(item => ({ ...item, category: "Kullanıcı" }))] : [];
  const choices = [...suggestions, { id: "all", title: `“${q}” için tüm sonuçlar`, href: searchPath(q), meta: "Paylaşımlar, topluluklar ve kullanıcılar", category: "Ara" }];
  const expanded = open && q.length >= 2;
  function navigate(href: string) { requestNavigation(() => { setOpen(false); router.push(href); }); }
  return <div className={styles.bar} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <form role="search" className={styles.searchForm} onSubmit={event => { event.preventDefault(); if (q.length >= 2) navigate(expanded && active >= 0 ? choices[active]?.href ?? searchPath(q) : searchPath(q)); }}>
      <Search size={20} aria-hidden="true" />
      <input aria-label="ListeKutusu’nda ara" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined} autoComplete="off" maxLength={100} placeholder="Paylaşım, topluluk veya kullanıcı ara" value={value} onFocus={() => setOpen(true)} onChange={event => { setValue(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={event => {
        if (event.key === "Escape") { setOpen(false); setActive(-1); }
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && q.length >= 2) { event.preventDefault(); setOpen(true); setActive(index => index < 0 ? event.key === "ArrowDown" ? 0 : choices.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length); }
      }} />
      <button type="submit" disabled={q.length < 2}>Ara</button>
    </form>
    {expanded && <div className={styles.dropdown}>
      <p className={styles.hint} role="status">{failed ? "Öneriler yüklenemedi. Tam aramayı deneyebilirsin." : !result ? "Öneriler aranıyor…" : suggestions.length ? "Hızlı erişim" : "Öneri bulunamadı. Paylaşımları da ara."}</p>
      <div id={listId} role="listbox" aria-label="Arama önerileri">{choices.map((item, index) => <Link role="option" aria-selected={index === active} id={`${listId}-${index}`} tabIndex={-1} className={`${styles.suggestion} ${index === active ? styles.active : ""}`} key={`${item.category}-${item.id}`} href={item.href} onClick={() => setOpen(false)}><span className={styles.avatar} aria-hidden="true">{item.title.slice(0, 1)}</span><span><strong>{item.title}</strong><small>{item.category} · {item.meta}</small></span></Link>)}</div>
    </div>}
  </div>;
}
