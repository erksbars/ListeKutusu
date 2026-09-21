"use client";

import Link from "next/link";
import type { FeedScope } from "./FeedSectionHeader";

const emptyCopy: Record<FeedScope, { title: string; description: string }> = {
  all: {
    title: "Akış henüz boş",
    description: "İlk şarkıyı paylaşınca burası sosyal keşif sayfasına dönüşmeye başlar.",
  },
  trending: {
    title: "Henüz yükselen paylaşım yok",
    description: "Beğenilen ve listelere eklenen parçalar burada yükselir.",
  },
  following: {
    title: "Takip akışın boş",
    description: "Takip ettiğin kullanıcılar paylaşım yaptığında burada görünecek. Şimdilik genel keşfe dönebilirsin.",
  },
  personalized: {
    title: "Sana özel akış hazırlanıyor",
    description: "Beğendikçe, listene ekledikçe ve profilleri takip ettikçe önerilerin gelişecek.",
  },
  saved: {
    title: "Henüz kaydettiğin paylaşım yok",
    description: "Daha sonra dönmek istediğin keşifleri paylaşım menüsünden kaydedebilirsin.",
  },
};

type FeedEmptyStateProps = {
  scope: FeedScope;
  authenticated: boolean;
  reason?: string | null;
  topicFiltered?: boolean;
  onClearTopic?: () => void;
  onSelectAll: () => void;
  onCompose: () => void;
};

export function FeedEmptyState({
  scope,
  authenticated,
  reason,
  topicFiltered = false,
  onClearTopic,
  onSelectAll,
  onCompose,
}: FeedEmptyStateProps) {
  if (topicFiltered) {
    return (
      <div className="feed-empty-state">
        <span className="feed-empty-title">Bu konuda henüz keşif yok</span>
        <p>Diğer etiketlere dönerek akıştaki parçaları keşfetmeye devam edebilirsin.</p>
        <button type="button" onClick={onClearTopic} className="secondary-action mt-4 h-10 rounded-xl px-4 text-xs font-black">
          Tüm keşifleri göster
        </button>
      </div>
    );
  }

  const copy = emptyCopy[scope];
  const protectedScope = scope === "following" || scope === "personalized" || scope === "saved";

  return (
    <div className="feed-empty-state">
      <span className="feed-empty-title">{copy.title}</span>
      <p>{reason || copy.description}</p>
      {protectedScope ? (
        <button type="button" onClick={onSelectAll} className="secondary-action mt-4 h-10 rounded-xl px-4 text-xs font-black">
          Yeni akışa geç
        </button>
      ) : authenticated ? (
        <button type="button" onClick={onCompose} className="primary-action mt-4 h-10 rounded-xl px-4 text-xs font-black">
          İlk şarkını paylaş
        </button>
      ) : (
        <Link href="/account?mode=create" className="primary-action mt-4 inline-flex h-10 items-center rounded-xl px-4 text-xs font-black">
          Hesap aç ve paylaş
        </Link>
      )}
    </div>
  );
}
