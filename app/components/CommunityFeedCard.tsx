"use client";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { communityFeedAnchor, communityFeedPath, feedReturnPath } from "@/lib/feedNavigation";
import type { GeneralCommunityItem } from "@/lib/communityGeneralFeed";
import { REVIEW_KINDS } from "@/lib/communityTypes";
import { TVmazeAttribution } from "./TVmazeAttribution";
import styles from "./CommunityGeneralFeed.module.css";
import { CommunityCardActions } from "./CommunityCardActions";
import { CommunityInlineComments } from "./CommunityInlineComments";
import { CalendarDays, MessageCircle, Star, MapPin, Users } from "lucide-react";

const postedAt = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

export function CommunityFeedCard({ item, viewerId = null, surface = "feed", onUnsave, returnTo }: { item: GeneralCommunityItem; viewerId?: string | null; surface?: "feed" | "saved"; onUnsave?: () => void; returnTo?: string }) {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => setUnavailable(false), [item, viewerId]);
  const anchor = communityFeedAnchor(item.kind, item.id);
  const cardId = returnTo && anchor ? anchor.slice(1) : undefined;
  if (unavailable) return <article id={cardId} className={`ui-card ${styles.item}`}><p role="status">Bu paylaşım artık bu görünümde bulunmuyor. Listeyi yenileyebilirsin.</p></article>;
  const base = `/communities/${encodeURIComponent(item.community.slug)}`;
  const href = returnTo ? communityFeedPath(item.community.slug, item.kind, item.id, returnTo) : item.kind === "event" ? `${base}?section=events&event=${encodeURIComponent(item.id)}` : `${base}?post=${encodeURIComponent(item.id)}`;
  function rememberSource(event: MouseEvent<HTMLAnchorElement>) {
    if (!returnTo || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.location.pathname !== "/") return;
    const from = new URL(href, window.location.origin).searchParams.get("from");
    window.history.replaceState(window.history.state, "", feedReturnPath(from));
  }
  const kindLabel = item.kind === "event" ? "Etkinlik" : item.type === "review" ? `${REVIEW_KINDS[item.reviewKind as keyof typeof REVIEW_KINDS] ?? "Eser"} incelemesi` : "Sohbet";
  const Icon = item.kind === "event" ? CalendarDays : item.type === "review" ? Star : MessageCircle;
  return <article id={cardId} className={`feed-post-card ${styles.item}`} data-feed-kind={item.kind === "event" ? "event" : item.type} data-feed-id={`${item.kind}:${item.id}`}>
    <header className="feed-post-header">
      <div className="flex min-w-0 items-start gap-3">
        <Link className="nav-avatar feed-post-avatar" href={`/u/${item.author.slug}`} aria-label={`${item.author.ownerName} profilini aç`}>{item.author.ownerName.slice(0, 1).toUpperCase()}</Link>
        <div className="min-w-0"><div className="feed-post-identity"><Link className="feed-post-author" href={`/u/${item.author.slug}`}>{item.author.ownerName}</Link><span aria-hidden="true">·</span><Link className="feed-post-permalink" href={href} onClick={rememberSource} aria-label={`${item.title} paylaşımını aç`}><time dateTime={item.createdAt}>{postedAt.format(new Date(item.createdAt))}</time></Link></div>
          <Link className={styles.source} href={base}>{item.community.name}</Link>
        </div>
      </div>
      <span className="feed-content-kind">{kindLabel}</span>
    </header>
    <div className="feed-track-block"><span className="feed-track-icon" aria-hidden="true"><Icon size={18} /></span><div className="min-w-0"><h2><Link href={href} onClick={rememberSource}>{item.title}</Link></h2>{item.kind === "post" && item.type === "review" && <p>{item.subjectTitle} · <strong>{item.rating}/10</strong></p>}</div></div>
    {item.kind === "post" && item.referenceProvider === "tvmaze" && <p><TVmazeAttribution /></p>}
    <p className={item.kind === "post" && item.spoiler ? styles.spoiler : styles.body}>{item.kind === "post" && item.spoiler ? "Spoiler nedeniyle önizleme gizlendi. İncelemeyi açarak görüntüleyebilirsin." : item.excerpt}</p>
    {item.kind === "event" && <div className={styles.eventDetails}><p><CalendarDays size={16} aria-hidden="true" /><time dateTime={item.startsAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: item.timeZone }).format(new Date(item.startsAt))} · Türkiye saati</time></p><p><MapPin size={16} aria-hidden="true" />{item.city} · {item.venue}</p><p><Users size={16} aria-hidden="true" />{item.capacity == null ? "Katılımcı sınırı yok" : `${item.capacity} kişilik kapasite`}</p><p>{item.status === "cancelled" ? "Etkinlik iptal edildi." : "Katılım için aktif topluluk üyeliği gerekir."}</p></div>}
    <footer className={styles.footer}><Link className={styles.detail} href={href} onClick={rememberSource}>{item.kind === "event" ? "Etkinlik detayını aç" : item.type === "review" ? "İncelemeyi aç" : "Sohbeti aç"} ↗</Link>
    {item.kind === "post" && <CommunityCardActions key={viewerId ?? "anonymous"} initial={item} slug={item.community.slug} postId={item.id} viewerId={viewerId} surface={surface} loginReturnTo={returnTo ? feedReturnPath(returnTo).split("#")[0] + anchor : undefined} onUnsave={onUnsave} onUnavailable={() => setUnavailable(true)} />}
    </footer>
    {item.kind === "post" && surface === "feed" && <CommunityInlineComments key={`${item.id}:${viewerId}`} slug={item.community.slug} postId={item.id} viewerId={viewerId} spoiler={item.spoiler} returnTo={returnTo ? feedReturnPath(returnTo).split("#")[0] + anchor : href} />}
  </article>;
}
