"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { PageTopbar } from "@/app/components/PageTopbar";
import { CommunityFeedCard } from "@/app/components/CommunityFeedCard";
import { Button, buttonClassName } from "@/app/components/ui/Button";
import { SelectField } from "@/app/components/ui/Field";
import type { CommunitySavedPage } from "@/lib/communitySavedPosts";
import type { PostTypeFilter, ReviewKindFilter } from "@/lib/communityPostFilters";
import { REVIEW_KINDS } from "@/lib/communityTypes";
import { useCommunityRead } from "../communities/useCommunityRead";
import { CommunityReadFeedback } from "@/app/components/CommunityReadFeedback";
import { ContentState } from "@/app/components/ui/ContentState";
import { accountLoginPath } from "@/lib/navigation";

export function CommunitySavedClient({ page, postType, reviewKind }: { page: number; postType: PostTypeFilter; reviewKind: ReviewKindFilter }) {
  const router = useRouter(), [revision, setRevision] = useState(0);
  const params = new URLSearchParams({ page: String(page), postType, reviewKind }), api = `/api/communities/saved?${params}`;
  function href(next: { page?: number; postType?: string; reviewKind?: string } = {}) {
    return `/community-saved?${new URLSearchParams({ page: String(next.page ?? page), postType: next.postType ?? postType, reviewKind: next.reviewKind ?? reviewKind })}`;
  }
  const { data, error, loading, status: readStatus } = useCommunityRead<CommunitySavedPage>(api, revision);
  function removed() {
    if (data?.items.length === 1 && page > 1) router.replace(href({ page: page - 1 }));
    else setRevision(value => value + 1);
  }
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title="Topluluk kayıtlarım" subtitle="Farklı topluluklardan sohbet ve incelemeler · yalnız sana özel" icon={<Bookmark size={22} aria-hidden="true" />} backHref="/communities" actions={<Link className={buttonClassName()} href="/?scope=saved">Müzik kayıtları ↗</Link>} />
    <div className="community-intro"><p>Kayıt tarihine göre yeniden eskiye sıralanır. Kayıt, içerik kopyası değildir: kaldırılan, engellenen veya pasif yazara ait paylaşımlar görünmez.</p><p>Arşivlenmiş toplulukların görünür kayıtlarını okuyabilir ve kendi kaydını kaldırabilirsin. Etkinlikler bu listeye dahil değildir.</p></div>
    <section className="community-stack" aria-label="Özel topluluk kayıtları">
      <div className="community-actions">
        <SelectField label="Kayıt türü" value={postType} onChange={event => router.push(href({ page: 1, postType: event.target.value, reviewKind: "all" }))}><option value="all">Tümü</option><option value="discussion">Sohbet</option><option value="review">İnceleme</option></SelectField>
        {postType === "review" && <SelectField label="İnceleme alanı" value={reviewKind} onChange={event => router.push(href({ page: 1, reviewKind: event.target.value }))}><option value="all">Bütün alanlar</option>{Object.entries(REVIEW_KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>}
        <Button type="button" disabled={loading} onClick={() => setRevision(value => value + 1)}>Kayıtları yenile</Button>
      </div>
      <CommunityReadFeedback loading={loading} error={error} status={readStatus} loadingLabel="Kayıtlar yükleniyor…" errorTitle="Kayıtların yüklenemedi" loginHref={accountLoginPath(href())} onRetry={() => setRevision(value => value + 1)} />
      {data && <><p>Sayfa {page} · {data.items.length} görünür kayıt</p>
        {!data.items.length && <ContentState kind="empty" title="Bu filtrelerde kayıt yok"><p>Filtrelerini değiştirebilir veya topluluklardan kaydettiğin içeriklere daha sonra dönebilirsin.</p></ContentState>}
        {data.items.map(item => <div className="community-stack" key={item.id}>
          <p><time dateTime={item.savedAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(item.savedAt))}</time> tarihinde kaydedildi{item.community.status === "archived" ? " · Topluluk arşivde" : ""}</p>
          <CommunityFeedCard item={item} viewerId="session" surface="saved" onUnsave={removed} />
        </div>)}
        <nav className="community-actions" aria-label="Kayıt sayfaları">
          {page > 1 && <Link className={buttonClassName()} href={href({ page: page - 1 })}>Önceki kayıtlar</Link>}
          {data.hasMore && <Link className={buttonClassName()} href={href({ page: page + 1 })}>Sonraki kayıtlar</Link>}
        </nav>
      </>}
    </section>
  </section></main>;
}
