"use client";
import { Bookmark, RefreshCw } from "lucide-react";
import { REVIEW_KINDS } from "@/lib/communityTypes";
import type { CommunityNavigation } from "@/lib/communityNavigation";
import { Button } from "@/app/components/ui/Button";
import { SelectField } from "@/app/components/ui/Field";
import { FeedContentTabs } from "@/app/components/FeedContentTabs";

export function CommunityContentFilters({ value, disabled, authenticated, change, onRefresh }: { value: CommunityNavigation; disabled: boolean; authenticated: boolean; change: (patch: Partial<CommunityNavigation>) => void; onRefresh: () => void }) {
  return <div aria-label="Topluluk içerik filtreleri">
    <div className="feed-section-heading"><div className="flex items-center justify-between gap-2">
      <div className="feed-tabs"><span className="feed-tab feed-tab-active">Yeni</span></div>
      <div className="community-actions">
        {authenticated && <Button type="button" variant={value.savedOnly ? "primary" : "ghost"} disabled={disabled} aria-pressed={value.savedOnly} title="Yalnız sana özel kayıtlar" onClick={() => change({ savedOnly: !value.savedOnly, ...(value.kind === "event" ? { kind: "all", section: "posts", postType: "all" } : {}) })}><Bookmark size={16} aria-hidden="true" />Kaydettiklerim</Button>}
        <Button type="button" variant="secondary" size="icon" disabled={disabled} onClick={onRefresh} aria-label="Akışı yenile" title="Akışı yenile"><RefreshCw size={17} aria-hidden="true" /></Button>
      </div>
    </div></div>
    <FeedContentTabs value={value.kind} includeMusic={false} disabled={disabled} onChange={kind => {
      if (kind === "music") return;
      change({ kind, section: kind === "event" ? "events" : "posts", postType: kind === "review" || kind === "discussion" ? kind : "all", reviewKind: "all", ...(kind === "event" ? { savedOnly: false } : {}), postId: null, eventId: null });
    }} />
    {(value.kind === "review" || value.kind === "event" || value.savedOnly) && <div className="community-actions">
      {value.kind === "review" && <SelectField label="İnceleme alanı" value={value.reviewKind} disabled={disabled} onChange={event => change({ reviewKind: event.target.value as CommunityNavigation["reviewKind"] })}><option value="all">Tüm incelemeler</option>{Object.entries(REVIEW_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>}
      {value.kind === "event" && <SelectField label="Etkinlik zamanı" value={value.eventFilter} disabled={disabled} onChange={event => change({ eventFilter: event.target.value as CommunityNavigation["eventFilter"] })}><option value="upcoming">Yaklaşan</option><option value="past">Başlangıcı geçmiş</option><option value="cancelled">İptal edilen</option></SelectField>}
      {value.savedOnly && <p>Kayıtların · Yalnız sana özel</p>}
    </div>}
  </div>;
}
