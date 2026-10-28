"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SEARCH_SCOPES, searchPath, searchQuery, searchScope, type SearchIdentity, type SearchScope, type SocialSearchResult } from "@/lib/socialSearchTypes";
import { PageTopbar } from "@/app/components/PageTopbar";
import styles from "@/app/components/SocialSearch.module.css";

const kinds = { music: "Müzik", discussion: "Sohbet", review: "İnceleme", event: "Etkinlik" };
function Identities({ items }: { items: SearchIdentity[] }) {
  return items.map(item => <article className={styles.card} key={item.id}><div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{item.title.slice(0, 1)}</span><div><Link href={item.href}><strong>{item.title}</strong></Link><span className={styles.meta}>{item.meta}</span>{item.description && <p>{item.description}</p>}</div></div></article>);
}
export function SearchResults() {
  const params = useSearchParams(), query = searchQuery(params.get("q")), scope = searchScope(params.get("type"));
  const rawPage = Number(params.get("page") ?? 1), page = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 50 ? rawPage : 1;
  const [data, setData] = useState<SocialSearchResult | null>(null), [failure, setFailure] = useState(""), [retry, setRetry] = useState(0);
  const context = JSON.stringify([query, scope, page, retry]), error = failure === context;
  useEffect(() => {
    setData(null); setFailure("");
    if (query.length < 2) return;
    const controller = new AbortController();
    fetch(`/api/social-search?${new URLSearchParams({ q: query, type: scope, page: String(page) })}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<SocialSearchResult>; })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) setFailure(context); });
    return () => controller.abort();
  }, [query, scope, page, retry, context]);
  const current = data?.query === query && data.scope === scope && data.page === page ? data : null;
  const count = current ? current.posts.length + current.communities.length + current.people.length : 0;
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><div className={styles.results}>
    <PageTopbar title={query ? `“${query}” için sonuçlar` : "ListeKutusu’nda ara"} subtitle="Paylaşımlar, topluluklar ve insanlar tek yerde." icon={<Search size={22} />} />
    <nav className={styles.tabs} aria-label="Arama sonucu türü">{(Object.entries(SEARCH_SCOPES) as [SearchScope, string][]).map(([key, label]) => <Link key={key} href={searchPath(query, key)} aria-current={scope === key ? "page" : undefined}>{label}</Link>)}</nav>
    {query.length < 2 ? <div className={styles.state}><h2>Ne keşfetmek istersin?</h2><p>Üstteki arama kutusuna en az iki karakter yaz. Sonuçları buradan içerik türüne göre daraltabilirsin.</p><Link href="/communities">Toplulukları keşfet →</Link></div> : error ? <div className={styles.state} role="alert"><h2>Arama yüklenemedi</h2><p>Bağlantını kontrol edip yeniden deneyebilirsin.</p><button type="button" className={styles.retry} onClick={() => setRetry(value => value + 1)}>Yeniden dene</button></div> : !current ? <div className={styles.state} role="status">Sonuçlar aranıyor…</div> : <>
      <p className={styles.hint} role="status">{count ? `Bu sayfada ${count} sonuç` : "Bu aramada sonuç bulunamadı."}{scope === "all" && count > 0 ? " · Daha fazlası için tür sekmelerini kullan." : ""}</p>
      {!count && <div className={styles.state}><h2>{page > 1 ? "Bu sayfada sonuç kalmadı" : "Başka bir kelime dene"}</h2><p>Daha kısa bir ifade kullanabilir veya tüm sonuçlara geçebilirsin.</p><Link href={searchPath(query)}>Tüm sonuçlara dön →</Link></div>}
      {current.posts.length > 0 && <section className={styles.section} aria-label="Paylaşımlar"><h2>Paylaşımlar</h2><p className={styles.hint}>Bu sayfadaki paylaşımlar en yeniden eskiye gösterilir.</p>{current.posts.map(item => <article className={styles.card} key={`${item.kind}-${item.id}`}><div className={styles.meta}><span>{kinds[item.kind]}</span>{item.community && <span>· {item.community}</span>}<Link href={item.authorHref}>{item.author}</Link><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</time></div><h3><Link href={item.href}>{item.title}</Link></h3><p>{item.excerpt}</p>{item.spoiler && <span className={styles.meta}>Spoiler</span>}</article>)}</section>}
      {current.communities.length > 0 && <section className={styles.section} aria-label="Topluluklar"><h2>Topluluklar</h2><Identities items={current.communities} /></section>}
      {current.people.length > 0 && <section className={styles.section} aria-label="Kullanıcılar"><h2>Kullanıcılar</h2><Identities items={current.people} /></section>}
      {(page > 1 || current.hasMore) && <nav className={styles.pager} aria-label="Sonuç sayfaları">{page > 1 && <Link href={searchPath(query, scope, page - 1)}>← Önceki</Link>}<span>Sayfa {page}</span>{current.hasMore && <Link href={searchPath(query, scope, page + 1)}>Sonraki →</Link>}</nav>}
    </>}
  </div></main>;
}
