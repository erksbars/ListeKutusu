"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { GeneralCommunityItem } from "@/lib/communityGeneralFeed";
import type { CommunityEventDetail } from "@/lib/communityTypes";
import { accountLoginPath } from "@/lib/navigation";
import { useCommunityRead } from "../(social)/communities/useCommunityRead";
import { communityError, communityFetch } from "../(social)/communities/communityFetch";
import { useDraftNavigationGuard } from "./DraftNavigationProvider";
import { Button } from "./ui/Button";
import { ExpandablePostText } from "./ExpandablePostText";
import styles from "./CommunityGeneralFeed.module.css";

export function CommunityInlineEvent({ item, viewerId, returnTo, refreshKey = 0 }: { item: Extract<GeneralCommunityItem, { kind: "event" }>; viewerId: string | null; returnTo: string; refreshKey?: number }) {
  const [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const pending = useRef(false);
  const communityApi = `/api/communities/${encodeURIComponent(item.community.slug)}`, api = `${communityApi}/events/${encodeURIComponent(item.id)}`;
  const read = useCommunityRead<CommunityEventDetail>(api, `${viewerId}:${revision}:${refreshKey}`);
  useDraftNavigationGuard({ dirty: false, busy });
  const valid = read.data?.event?.id === item.id && typeof read.data.event.description === "string" && Number.isInteger(read.data.event.attendingCount) && read.data.event.attendingCount >= 0 && Number.isInteger(read.data.event.interestedCount) && read.data.event.interestedCount >= 0 && typeof read.data.canRespond === "boolean" && typeof read.data.canWithdraw === "boolean";
  const detail = valid ? read.data : null, event = detail?.event ?? item;
  const readError = read.error || (read.data && !valid ? "Etkinlik bilgileri doğrulanamadı. Yeniden deneyebilirsin." : "");
  const full = Boolean(detail && event.capacity !== null && detail.event.attendingCount >= event.capacity);
  const upcoming = event.status === "scheduled" && new Date(event.startsAt) > new Date();
  async function respond(status: "attending" | "interested" | "withdrawn" | "join") {
    if (!viewerId || pending.current || read.loading || !detail) return;
    if (status !== "join" && (status === "withdrawn" ? !detail.canWithdraw : !detail.canRespond || !upcoming)) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await communityFetch<{ ok: boolean }>(status === "join" ? communityApi : api, status === "join" ? { action: "join" } : { action: "rsvp", status });
      if (result?.ok !== true) throw new Error("Yanıt doğrulanamadı. Tercihini yeniden göndermeden önce bilgileri yenile.");
      setNotice(status === "join" ? "Topluluğa katıldın. Katılım tercihini şimdi belirtebilirsin." : "Katılım tercihin kaydedildi.");
    } catch (cause) { setError(communityError(cause)); }
    finally { pending.current = false; setBusy(false); setRevision(value => value + 1); }
  }
  return <>
    <ExpandablePostText text={detail?.event.description ?? item.content ?? item.excerpt} />
    <div className={styles.eventDetails}>
      <p><CalendarDays size={16} aria-hidden="true" /><time dateTime={event.startsAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: event.timeZone }).format(new Date(event.startsAt))} · Türkiye saati</time></p>
      <p><MapPin size={16} aria-hidden="true" />{event.city} · {event.venue}</p>
      <p><Users size={16} aria-hidden="true" />{event.capacity === null ? "Katılımcı sınırı yok" : `${event.capacity} kişilik kapasite`}</p>
      {detail && <><p className={styles.attendance} role="status">{detail.event.attendingCount} katılacak · {detail.event.interestedCount} ilgileniyor{event.capacity !== null ? ` · ${Math.max(0, event.capacity - detail.event.attendingCount)} yer kaldı` : ""}</p><p>Tercihin: {detail.event.viewerStatus === "attending" ? "Katılacağım" : detail.event.viewerStatus === "interested" ? "İlgileniyorum" : detail.event.viewerStatus === "withdrawn" ? "Vazgeçtim" : "Henüz belirtilmedi"}</p></>}
      {event.status === "cancelled" && <p role="status">Etkinlik iptal edildi. Yeni katılım kapalı.</p>}
      {event.status !== "cancelled" && !upcoming && <p role="status">Etkinlik başladı. Yeni katılım kapalı.</p>}
    </div>
    {read.loading && <p role="status">Katılım bilgileri güncelleniyor…</p>}
    {readError && <div role="alert"><p>{readError}</p><Button type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Yeniden dene</Button></div>}
    {detail && <div className={styles.eventControls}>
      {detail.canRespond && viewerId && upcoming && <><p className={styles.eventHint}>Katılım tercihin düzenleyen ve topluluk yöneticilerine görünür.</p><div className={styles.actions} role="group" aria-label="Etkinlik katılım tercihi"><Button type="button" variant={detail.event.viewerStatus === "attending" ? "primary" : "secondary"} aria-pressed={detail.event.viewerStatus === "attending"} disabled={busy || (full && detail.event.viewerStatus !== "attending")} onClick={() => void respond("attending")}>Katılacağım</Button><Button type="button" aria-pressed={detail.event.viewerStatus === "interested"} disabled={busy} onClick={() => void respond("interested")}>İlgileniyorum</Button></div>{full && <p>Etkinlik dolu. İlgileniyorum seçeneği koltuk tüketmez.</p>}</>}
      {detail.canWithdraw && viewerId && <Button type="button" disabled={busy} onClick={() => void respond("withdrawn")}>Vazgeçtim</Button>}
      {!viewerId ? <Link href={accountLoginPath(returnTo)}>Katılmak için giriş yap →</Link> : !detail.canRespond && upcoming && <div><p>Katılım için aktif topluluk üyeliği gerekir.</p><Button type="button" disabled={busy} onClick={() => void respond("join")}>Topluluğa katıl</Button></div>}
      <Button type="button" variant="ghost" disabled={busy} onClick={() => setRevision(value => value + 1)}>Katılımı yenile</Button>
    </div>}
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </>;
}
