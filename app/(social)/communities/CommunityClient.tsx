"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import type { CommunityAuthor, CommunityDetail, CommunityPostDetail } from "@/lib/communityTypes";
import { COMMUNITY_CATEGORIES } from "@/lib/communityTypes";
import { PageTopbar } from "@/app/components/PageTopbar";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { Toast } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/Button";
import { TextAreaField } from "@/app/components/ui/Field";
import { communityError, communityFetch } from "./communityFetch";
import { CommunityComposer } from "./CommunityComposer";
import { ReviewMetadata } from "./ReviewMetadata";
import { CommunityEventsPanel } from "./CommunityEventsPanel";
import { NotificationCenter } from "@/app/components/NotificationCenter";
import { CommunityDistributionField } from "@/app/components/CommunityDistributionField";
import { CommunityDiscoveryLabelsView } from "./CommunityDiscoveryFields";
import { CommunityDiscoveryEditor } from "./CommunityDiscoveryEditor";
import { CommunityManagementPanel } from "./CommunityManagementPanel";
import { CommunityOwnershipPanel } from "./CommunityOwnershipPanel";
import { useCommunityNavigation } from "./useCommunityNavigation";
import { communityNavigationParams, type CommunityNavigation } from "@/lib/communityNavigation";
import { accountLoginPath } from "@/lib/navigation";
import { CommunityReviewEditor } from "./CommunityReviewEditor";
import { CommunityContentFilters } from "./CommunityContentFilters";
import { CommunityPostReactions } from "./CommunityPostReactions";
import { useCommunityRead } from "./useCommunityRead";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";

export function CommunityClient({ slug, initialNavigation, initialFeedReturnTo = null }: { slug: string; initialNavigation: CommunityNavigation; initialFeedReturnTo?: string | null }) {
  const api = `/api/communities/${encodeURIComponent(slug)}`;
  const [data, setData] = useState<CommunityDetail | null>(null);
  const { navigation, navigate, feedReturnTo } = useCommunityNavigation(initialNavigation, initialFeedReturnTo);
  const loginParams = communityNavigationParams(new URLSearchParams(), navigation);
  if (feedReturnTo) loginParams.set("from", feedReturnTo);
  const loginHref = accountLoginPath(`/communities/${encodeURIComponent(slug)}${loginParams.size ? `?${loginParams}` : ""}`);
  const { postId, page, section, commentPage, postType, reviewKind, savedOnly } = navigation;
  const listApi = `${api}?${new URLSearchParams({ page: String(page), postType, reviewKind, ...(savedOnly ? { saved: "1" } : {}) })}`;
  const [loadedListApi, setLoadedListApi] = useState("");
  const [editingReview, setEditingReview] = useState(false);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [discardReview, setDiscardReview] = useState<"editor" | "list" | null>(null);
  const [eventsVisited, setEventsVisited] = useState(section === "events");
  useEffect(() => { if (section === "events") setEventsVisited(true); }, [section]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { data: post, loading: postLoading, error: postError } = useCommunityRead<CommunityPostDetail>(postId ? `${api}/posts/${encodeURIComponent(postId)}?page=${commentPage}` : null, revision);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [revealedPostId, setRevealedPostId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [reportTarget, setReportTarget] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; body: Record<string, unknown> } | null>(null);
  const requestPageExit = useDraftNavigationGuard({ dirty: Boolean(comment || (reportTarget && reason)), busy,
    discard: () => { setComment(""); setReason(""); setReportTarget(null); } });
  const requestDraftExit = (proceed: () => void) => requestPageExit(proceed, true);
  const member = data?.membership?.status === "active";
  const archived = data?.community.status === "archived";
  const canWrite = Boolean(member && !archived && !loading && !busy);
  const canReadBody = Boolean(post && !editingReview && (!post.post.spoiler || revealedPostId === postId));
  const listingCurrent = loadedListApi === listApi && !loading;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    communityFetch<CommunityDetail>(listApi, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setData(result); setLoadedListApi(listApi); } })
      .catch(error => { if (!controller.signal.aborted) { setLoadError(communityError(error)); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [listApi, revision]);
  useEffect(() => { setRevealedPostId(null); setComment(""); setReportTarget(null); setConfirm(null); setActionError(""); setEditingReview(false); setReviewDirty(false); setDiscardReview(null); }, [postId]);
  function openPost(id: string | null, confirmed = false) { navigate({ section: "posts", postId: id, commentPage: 1 }, false, confirmed); }
  function closeReview(target: "editor" | "list") {
    if (target === "list") { requestDraftExit(() => { setEditingReview(false); setReviewDirty(false); openPost(null, true); }); return; }
    if (editingReview && reviewDirty) { setDiscardReview(target); return; }
    setEditingReview(false); setReviewDirty(false);
  }
  async function mutate(payload: Record<string, unknown>, success: string, after?: () => void) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setActionError("");
    try {
      await communityFetch(api, payload);
      after?.(); setMessage(success); setConfirm(null); setRevision(value => value + 1);
    } catch (error) { setActionError(communityError(error)); setConfirm(null); }
    finally { busyRef.current = false; setBusy(false); }
  }
  function contentActions(author: CommunityAuthor, targetPostId: string, commentId?: string) {
    if (!member) return null;
    return <div className="community-actions">
      {(author.id === data?.viewerId || data?.canModerate) && <Button type="button" variant="ghost" disabled={!canWrite || editingReview} onClick={() => setConfirm({ title: commentId ? "Yorumu kaldır?" : "Paylaşımı kaldır?", body: { action: commentId ? "remove-comment" : "remove-post", postId: targetPostId, ...(commentId ? { commentId } : {}) } })}>{commentId ? "Yorumu kaldır" : "Paylaşımı kaldır"}</Button>}
      {author.id !== data?.viewerId && <Button type="button" variant="ghost" disabled={!canWrite || editingReview} onClick={() => { setReportTarget({ action: "report", postId: targetPostId, ...(commentId ? { commentId } : {}) }); setReason(""); }}>Bildir</Button>}
    </div>;
  }
  function react(targetPostId: string, action: "set-like" | "set-save", active: boolean) {
    void mutate({ action, postId: targetPostId, active }, action === "set-like" ? active ? "Paylaşımı beğendin." : "Beğeni kaldırıldı." : active ? "Paylaşım özel kayıtlarına eklendi." : "Özel kayıt kaldırıldı.", () => {
      if (action === "set-save" && !active && savedOnly && !postId && data?.posts.length === 1 && page > 1) navigate({ page: page - 1 }, true);
    });
  }
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title={data?.community.name ?? "Topluluk"} subtitle="Birlikte konuş, keşfet ve bağlantı kur." icon={<Users size={22} />} backHref={feedReturnTo ?? "/communities"} backLabel={feedReturnTo ? "Ana akışa dön" : "Geri"} actions={data?.viewerId ? <NotificationCenter /> : undefined} />
    <Toast message={message} onClose={() => setMessage(null)} />
    <ConfirmDialog open={Boolean(discardReview && editingReview && post)} title="İnceleme taslağından vazgeç?" body="Kaydetmediğin inceleme değişiklikleri silinecek. Yayındaki inceleme değişmeyecek." confirmLabel="Değişiklikleri sil ve çık" cancelLabel="Düzenlemeye devam et" busy={busy} onCancel={() => setDiscardReview(null)} onConfirm={() => { const target = discardReview; setDiscardReview(null); setEditingReview(false); setReviewDirty(false); if (target === "list") openPost(null); }} />
    <ConfirmDialog open={Boolean(confirm && (!confirm.body.postId || confirm.body.postId === post?.post.id))} title={confirm?.title ?? ""} body="Bu işlem topluluğa uygulanacak. Devam etmek istiyor musun?" confirmLabel="Onayla" tone="danger" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => confirm && (!confirm.body.postId || confirm.body.postId === post?.post.id) && void mutate(confirm.body, "İşlem tamamlandı.", () => { if (confirm.body.action === "remove-post") openPost(null); })} />
    {loadError && <div className="community-error" role="alert"><p>{loadError}</p>{savedOnly && <Link href={loginHref}>Kaydettiklerin için giriş yap ↗</Link>}<Button type="button" onClick={() => setRevision(value => value + 1)}>Yeniden dene</Button></div>}
    {loading && <p role="status">Topluluk yükleniyor…</p>}
    {actionError && <p className="community-error" role="alert">{actionError}</p>}
    {data && <><div className="community-intro"><p className="section-kicker">{COMMUNITY_CATEGORIES[data.community.category as keyof typeof COMMUNITY_CATEGORIES]} · Herkese açık</p><p>{data.community.description}</p><div className="community-actions"><span>{data.community.memberCount} üye</span>
      {!data.viewerId ? <Link href={loginHref}>Katılmak için giriş yap ↗</Link> : data.membership?.status === "banned" ? <span>Bu topluluğa katılımın kapatılmış.</span> : !member ? !archived && <Button type="button" variant="primary" loading={busy} disabled={loading} onClick={() => void mutate({ action: "join" }, "Topluluğa katıldın.")}>Topluluğa katıl</Button> : data.membership?.role === "owner" ? <span>Topluluğun sahibisin</span> : <Button type="button" disabled={loading || busy} onClick={() => setConfirm({ title: "Topluluktan ayrıl?", body: { action: "leave" } })}>Topluluktan ayrıl</Button>}
    </div><CommunityDiscoveryLabelsView values={data.community} /></div>
    {archived && <p role="status">Bu topluluk arşivde. İçerikler okunabilir; yeni katılım, paylaşım ve etkinlik işlemleri kapalıdır.</p>}
    <div className="community-actions" role="group" aria-label="Topluluk bölümleri"><Button type="button" variant={section === "posts" ? "primary" : "secondary"} aria-pressed={section === "posts"} disabled={busy} onClick={() => navigate({ section: "posts" })}>Sohbet ve incelemeler</Button><Button type="button" variant={section === "events" ? "primary" : "secondary"} aria-pressed={section === "events"} disabled={busy} onClick={() => navigate({ section: "events" })}>Etkinlikler</Button></div>
    <div className="community-columns"><section className="community-stack" aria-label="Topluluk sohbetleri" hidden={section !== "posts"}>
      <div hidden={Boolean(postId)} className="community-stack"><CommunityContentFilters value={navigation} disabled={loading || busy} authenticated={Boolean(data.viewerId)} change={navigate} />{member && !archived && <div hidden={savedOnly}><CommunityComposer disabled={!canWrite} publish={(payload, reset) => void mutate(payload, payload.type === "review" ? "İnceleme yayınlandı." : "Paylaşım yayınlandı.", () => { reset(); const matches = !savedOnly && (postType === "all" || postType === payload.type) && (reviewKind === "all" || reviewKind === payload.reviewKind); navigate(matches ? { page: 1 } : { page: 1, postType: "all", reviewKind: "all", savedOnly: false }, true); })} /></div>}</div>
      {postId ? <><Button type="button" disabled={busy} onClick={() => closeReview("list")}>Akışa dön</Button>{postLoading && <p role="status">Sohbet yükleniyor…</p>}{postError && <div role="alert" className="community-error"><p>{postError}</p><Button type="button" onClick={() => setRevision(value => value + 1)}>Sohbeti yeniden yükle</Button></div>}
        {post && <><article className="ui-card community-stack"><h2 className="ui-section-title">{post.post.title}</h2><ReviewMetadata post={post.post} /><Link href={`/u/${post.post.author.slug}`}>{post.post.author.ownerName}</Link>
          {post.post.spoiler && <div className="community-stack community-spoiler"><p>İnceleme metni ve yorumlar spoiler içerebilir.</p><Button type="button" aria-expanded={canReadBody} onClick={() => setRevealedPostId(canReadBody ? null : postId)}>{canReadBody ? "Spoilerı yeniden gizle" : "İncelemeyi ve yorumları göster"}</Button></div>}
          {canReadBody && <p className="community-body">{post.post.body}</p>}
          <p>{post.post.distribution === "general" ? "Genel akışta da gösteriliyor" : "Yalnız topluluk akışında dağıtılıyor"}</p>
          <Link href={`/communities/${encodeURIComponent(slug)}?post=${encodeURIComponent(post.post.id)}`}>Paylaşım bağlantısı ↗</Link>
          <CommunityPostReactions state={post.post} authenticated={Boolean(data.viewerId)} disabled={busy || loading || postLoading || editingReview} change={(action, active) => react(post.post.id, action, active)} />
          {post.post.type === "review" && post.post.author.id === data.viewerId && member && !archived && !editingReview && <Button type="button" disabled={!canWrite || postLoading} onClick={() => { setEditingReview(true); setActionError(""); }}>İncelemeyi düzenle</Button>}
          {editingReview && member && !archived && post.post.author.id === data.viewerId && <><CommunityReviewEditor key={post.post.id} post={post.post} disabled={!canWrite || postLoading} dirtyChanged={setReviewDirty} requestCancel={() => closeReview("editor")} cancel={() => { setEditingReview(false); setReviewDirty(false); }} save={(payload, done) => void mutate(payload, "İnceleme güncellendi.", () => { done(); setRevealedPostId(null); })} />{actionError && <Button type="button" disabled={busy} onClick={() => requestDraftExit(() => { setEditingReview(false); setRevision(value => value + 1); })}>Taslağı kapatıp güncel incelemeyi yükle</Button>}</>}
          {member && (post.post.author.id === data.viewerId || data.canModerate) && <CommunityDistributionField value={post.post.distribution} disabled={!canWrite || postLoading || editingReview} onChange={distribution => void mutate({ action: "set-distribution", postId, distribution }, "Akış tercihi güncellendi.")} />}
          {contentActions(post.post.author, post.post.id)}</article>
          {canReadBody && <><h3>Yorumlar</h3>{!post.comments.length && <p>İlk yorumu sen yazabilirsin.</p>}{post.comments.map(item => <article key={item.id} className="ui-card community-stack"><Link href={`/u/${item.author.slug}`}>{item.author.ownerName}</Link><p className="community-body">{item.body}</p>{contentActions(item.author, post.post.id, item.id)}</article>)}
          <div className="community-actions"><Button type="button" disabled={commentPage === 1 || busy || postLoading} onClick={() => navigate({ commentPage: commentPage - 1 })}>Önceki yorumlar</Button><span>Sayfa {post.page}</span><Button type="button" disabled={!post.hasMore || commentPage >= 100 || busy || postLoading} onClick={() => navigate({ commentPage: commentPage + 1 })}>Sonraki yorumlar</Button></div>
          {member && <form className="ui-panel community-stack" onSubmit={event => { event.preventDefault(); void mutate({ action: "comment", postId, body: comment }, "Yorum eklendi.", () => setComment("")); }}><TextAreaField label="Yorumun" value={comment} onChange={event => setComment(event.target.value)} minLength={2} maxLength={800} rows={3} required disabled={!canWrite || postLoading} /><Button type="submit" variant="primary" disabled={!canWrite || postLoading}>Yorum gönder</Button></form>}</>}
        </>}
      </> : <>
        {!data.posts.length && listingCurrent && <p>{savedOnly ? "Bu filtrelerde kaydettiğin görünür paylaşım yok." : postType !== "all" ? "Bu filtrelerde görünür paylaşım yok. İçerik türünü veya inceleme alanını değiştirebilirsin." : archived ? "Bu arşivde görünür paylaşım yok." : "Henüz görünür paylaşım yok. Aktif üyeler ilk sohbeti veya incelemeyi başlatabilir."}</p>}
        {listingCurrent && data.posts.map(item => <article className="ui-card community-stack" key={item.id}><h2><button type="button" className="community-title-button" disabled={busy} onClick={() => openPost(item.id)}>{item.title}</button></h2><ReviewMetadata post={item} /><Link href={`/u/${item.author.slug}`}>{item.author.ownerName}</Link><p className="community-body">{item.spoiler ? "Spoiler nedeniyle inceleme önizlemesi gizlendi." : item.excerpt}</p><CommunityPostReactions state={item} authenticated={Boolean(data.viewerId)} disabled={busy || loading} change={(action, active) => react(item.id, action, active)} /><div className="community-actions"><span>{item.commentCount} yorum</span><Button type="button" disabled={busy} onClick={() => openPost(item.id)}>{item.type === "review" ? "İncelemeyi aç" : "Sohbeti aç"}</Button></div></article>)}
        <div className="community-actions"><Button type="button" disabled={page === 1 || !listingCurrent || busy} onClick={() => navigate({ page: page - 1 })}>Önceki paylaşımlar</Button><span>Sayfa {page}</span><Button type="button" disabled={!data.hasMore || page >= 100 || !listingCurrent || busy} onClick={() => navigate({ page: page + 1 })}>Sonraki paylaşımlar</Button></div>
      </>}
      {reportTarget && <form className="ui-panel community-stack" onSubmit={event => { event.preventDefault(); void mutate({ ...reportTarget, reason }, "Bildirim topluluk yönetimine gönderildi.", () => setReportTarget(null)); }}><TextAreaField label="Bildirim nedeni" value={reason} onChange={event => setReason(event.target.value)} minLength={3} maxLength={300} rows={3} required disabled={!canWrite} /><div className="community-actions"><Button type="submit" disabled={!canWrite}>Bildirim gönder</Button><Button type="button" disabled={busy} onClick={() => setReportTarget(null)}>Vazgeç</Button></div></form>}
    </section>{(eventsVisited || section === "events") && <CommunityEventsPanel slug={slug} active={section === "events"} navigation={navigation} navigate={navigate} canCreate={Boolean(member && !archived)} refreshKey={revision} onModerationChange={() => setRevision(value => value + 1)} />}<aside className="community-stack"><section className="ui-panel community-stack"><h2 className="ui-section-title">Topluluk kuralları</h2><p className="community-body">{data.community.rules}</p><p>İçerikler herkese açık okunur. Yalnız toplulukta dağıtılabilir veya açık tercihle ana sayfanın Yeni/Takip akışında da gösterilebilir. Etkinlik katılımı aktif üyelik gerektirir.</p></section>
      {data.canModerate && data.viewerId && <CommunityManagementPanel slug={slug} viewerId={data.viewerId} owner={data.membership?.role === "owner"} disabled={loading || busy} readOnly={archived} revision={revision} mutate={mutate} openPost={openPost} />}
      {data.canModerate && <CommunityDiscoveryEditor values={data.community} disabled={!canWrite} busy={busy || loading} save={(payload, done) => void mutate(payload, "Keşif bilgileri güncellendi.", done)} />}
      {data.viewerId && <CommunityOwnershipPanel slug={slug} revision={revision} disabled={loading || busy} onChanged={() => setRevision(value => value + 1)} />}
      {data.viewerId && <Link href={`/community-cases?community=${encodeURIComponent(slug)}`}>Platforma bildir / itiraz et ↗</Link>}
    </aside></div></>}
  </section></main>;
}
