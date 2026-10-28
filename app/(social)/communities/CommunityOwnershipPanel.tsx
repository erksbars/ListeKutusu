"use client";
import { useEffect, useRef, useState } from "react";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";
import { Button } from "@/app/components/ui/Button";
import { TextField } from "@/app/components/ui/Field";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { communityError, communityFetch } from "./communityFetch";

type State = { owner: boolean; status: string; offer: { id: string; toName: string; expiresAt: string; canAccept: boolean } | null };
export function CommunityOwnershipPanel({ slug, revision, disabled, onChanged }: { slug: string; revision: number; disabled: boolean; onChanged: () => void }) {
  const api = `/api/communities/${encodeURIComponent(slug)}/ownership`;
  const [data, setData] = useState<State | null>(null), [error, setError] = useState("");
  const [loading, setLoading] = useState(true), [retry, setRetry] = useState(0), [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(""), [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; description: string; payload: Record<string, unknown> } | null>(null);
  const busyRef = useRef(false);
  useDraftNavigationGuard({ dirty: Boolean(target), busy: busy || disabled, preserveOnLocalNavigation: true,
    discard: () => { setTarget(""); setConfirm(null); } });
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    communityFetch<State>(api, undefined, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(error => { if (!controller.signal.aborted) { setData(null); setError(communityError(error)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [api, revision, retry]);
  async function write() {
    if (!confirm || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setMessage("");
    try { await communityFetch(api, confirm.payload); setMessage("Topluluk işlemi kaydedildi."); setConfirm(null); setTarget(""); onChanged(); }
    catch (error) { setError(communityError(error)); setConfirm(null); }
    finally { setBusy(false); busyRef.current = false; }
  }
  if (!loading && !error && !data?.owner && !data?.offer?.canAccept) return null;
  const blocked = disabled || loading || busy;
  return <section className="ui-panel community-stack" aria-label="Sahiplik ve arşiv">
    <h2 className="ui-section-title">Sahiplik ve arşiv</h2>
    {loading && <p role="status">Sahiplik durumu yükleniyor…</p>}
    {error && <div role="alert" className="community-error"><p>{error}</p>{!data && <Button type="button" onClick={() => setRetry(value => value + 1)}>Sahipliği yeniden yükle</Button>}</div>}
    {message && <p role="status">{message}</p>}
    {data?.offer && !loading && <><p>Teklif edilen üye: {data.offer.toName}</p><p>Son kabul: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(data.offer.expiresAt))} · Türkiye saati</p>
      {data.offer.canAccept ? <><p>Kabul ettiğinde topluluğun sahibi olursun. Önceki sahip normal üye kalır; yönetim ve üyelerle ilgili sorumlulukları devralırsın.</p><Button type="button" disabled={blocked} onClick={() => setConfirm({ title: "Topluluk sahipliğini kabul et?", description: "Mevcut sahibin gönderdiği devri kabul ederek tüm sahiplik yetkilerini alacaksın.", payload: { action: "accept", offerId: data.offer!.id, confirmation: "SAHİPLİĞİ KABUL ET" } })}>Sahipliği kabul et</Button><Button type="button" disabled={blocked} onClick={() => setConfirm({ title: "Sahiplik teklifini reddet?", description: "Hiçbir rol değişmeyecek.", payload: { action: "decline", offerId: data.offer!.id } })}>Teklifi reddet</Button></>
        : <Button type="button" disabled={blocked} onClick={() => setConfirm({ title: "Sahiplik teklifini geri çek?", description: "Mevcut sahiplik sende kalacak.", payload: { action: "cancel", offerId: data.offer!.id } })}>Teklifi geri çek</Button>}
    </>}
    {data?.owner && !loading && <>
      {data.status === "active" && !data.offer && <form className="community-stack" onSubmit={event => { event.preventDefault(); setConfirm({ title: "Sahiplik teklifi gönder?", description: "Seçilen aktif üye yedi gün içinde kabul ederse sahiplik ona geçer ve sen normal üye olursun. Kabulden önce geri çekebilirsin.", payload: { action: "offer", toSlug: target.trim(), confirmation: "SAHİPLİĞİ DEVRET" } }); }}><TextField label="Yeni sahibin profil kullanıcı adı" value={target} onChange={event => setTarget(event.target.value)} maxLength={100} required disabled={blocked} hint="Üyeler bölümündeki profil bağlantısının /u/ sonrasındaki kullanıcı adı. Aktif üye olmalı." /><Button type="submit" disabled={blocked}>Sahiplik teklifi gönder</Button></form>}
      <p>Arşivde içerikler bağlantıyla okunur; yeni üyelik, paylaşım ve etkinlik işlemleri kapanır. Genel keşif/akıştan çıkar. Yaklaşan etkinlikler iptal edilir. Yeniden açmak eski katılımları veya etkinlikleri canlandırmaz.</p>
      <Button type="button" disabled={blocked} onClick={() => setConfirm(data.status === "archived" ? { title: "Topluluğu yeniden aç?", description: "Yeni etkileşimler açılır. İptal edilmiş etkinlikler ve eski katılım tercihleri değişmez.", payload: { action: "restore", confirmation: "TOPLULUĞU YENİDEN AÇ" } } : { title: "Topluluğu arşivle?", description: "İçerikler silinmez. Bekleyen sahiplik teklifi kapanır; yaklaşan etkinlikler iptal edilir ve katılımlar çekilir.", payload: { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" } })}>{data.status === "archived" ? "Topluluğu yeniden aç" : "Topluluğu arşivle"}</Button>
    </>}
    <ConfirmDialog open={Boolean(confirm)} title={confirm?.title ?? ""} body={confirm?.description ?? ""} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void write()} />
  </section>;
}
