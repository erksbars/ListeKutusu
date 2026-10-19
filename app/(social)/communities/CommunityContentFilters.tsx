"use client";
import { REVIEW_KINDS } from "@/lib/communityTypes";
import type { CommunityNavigation } from "@/lib/communityNavigation";
import { Button } from "@/app/components/ui/Button";
import { SelectField } from "@/app/components/ui/Field";

export function CommunityContentFilters({ value, disabled, authenticated, change }: { value: CommunityNavigation; disabled: boolean; authenticated: boolean; change: (patch: Partial<CommunityNavigation>) => void }) {
  return <div className="ui-panel community-stack" aria-label="Topluluk içerik filtreleri">
    <SelectField label="Topluluk içerik türü" value={value.postType} disabled={disabled} onChange={event => change({ postType: event.target.value as CommunityNavigation["postType"], reviewKind: "all", page: 1 })}><option value="all">Tüm paylaşımlar</option><option value="discussion">Sohbetler</option><option value="review">İncelemeler</option></SelectField>
    {value.postType === "review" && <SelectField label="İnceleme alanı" value={value.reviewKind} disabled={disabled} onChange={event => change({ reviewKind: event.target.value as CommunityNavigation["reviewKind"], page: 1 })}><option value="all">Tüm incelemeler</option>{Object.entries(REVIEW_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</SelectField>}
    <label className="community-check"><input type="checkbox" checked={value.savedOnly} disabled={disabled || !authenticated} onChange={event => change({ savedOnly: event.target.checked, page: 1 })} />Kaydettiklerim · Yalnız bana özel</label>
    {value.savedOnly && <p>Bu toplulukta kaydettiğin görünür paylaşımlar. Kayıt içerik kopyası değildir; kaldırılan veya engelleme nedeniyle gizlenen içerik listelenmez. Sıra paylaşım tarihine göredir.</p>}
    {(value.postType !== "all" || value.savedOnly) && <Button type="button" disabled={disabled} onClick={() => change({ postType: "all", reviewKind: "all", savedOnly: false, page: 1 })}>İçerik filtrelerini temizle</Button>}
  </div>;
}
