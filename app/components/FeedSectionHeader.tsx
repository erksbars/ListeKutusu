"use client";

import type { KeyboardEvent } from "react";
import { Hash, RefreshCw } from "lucide-react";
import { Button, HorizontalScroller } from "./ui";

export type FeedScope = "all" | "trending" | "following" | "personalized" | "saved";

export const feedScopes: Array<{ id: FeedScope; label: string }> = [
  { id: "all", label: "Yeni" },
  { id: "trending", label: "Yükselen" },
  { id: "following", label: "Takip" },
  { id: "personalized", label: "Sana özel" },
  { id: "saved", label: "Kaydedilen" },
];

const feedScopeCopy: Record<FeedScope, {
  eyebrow: string;
  title: string;
  description: string;
}> = {
  all: {
    eyebrow: "Kulaktan kulağa",
    title: "Yeni keşifler",
    description: "Topluluğun az önce bıraktığı parçalar.",
  },
  trending: {
    eyebrow: "Yükselen sesler",
    title: "Listelere girenler",
    description: "Dinleyicilerin yalnızca beğenmeyip listelerine aldığı parçalar.",
  },
  following: {
    eyebrow: "Takip frekansı",
    title: "Seçtiğin insanların keşifleri",
    description: "Takip ettiğin müzik meraklılarından yeni paylaşımlar.",
  },
  personalized: {
    eyebrow: "Senin frekansın",
    title: "Kulağına yakın keşifler",
    description: "Etkileşimlerine göre sana yaklaşan parçalar.",
  },
  saved: {
    eyebrow: "Arşivin",
    title: "Dönmek istediklerin",
    description: "Sonra dinlemek için ayırdığın paylaşımlar.",
  },
};

export function isFeedScope(value: string | null): value is FeedScope {
  return feedScopes.some((scope) => scope.id === value);
}

type FeedSectionHeaderProps = {
  value: FeedScope;
  loading: boolean;
  topics: string[];
  activeTopic: string | null;
  onChange: (scope: FeedScope) => void;
  onTopicChange: (topic: string | null) => void;
  onRefresh: () => void;
};

export function FeedSectionHeader({
  value,
  loading,
  topics,
  activeTopic,
  onChange,
  onTopicChange,
  onRefresh,
}: FeedSectionHeaderProps) {
  const copy = feedScopeCopy[value];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = feedScopes.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? (index + 1) % feedScopes.length
          : (index - 1 + feedScopes.length) % feedScopes.length;
    const nextScope = feedScopes[nextIndex].id;
    onChange(nextScope);
    document.getElementById(`feed-tab-${nextScope}`)?.focus();
  }

  return (
    <div className="feed-section-heading">
      <div className="feed-section-copy">
        <p className="feed-section-eyebrow">
          <span aria-hidden="true" />
          {copy.eyebrow}
        </p>
        <h2>{copy.title}</h2>
        <p className="feed-section-description">{copy.description}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <HorizontalScroller
          ariaLabel="Akış filtresi"
          contentRole="tablist"
          className="min-w-0 flex-1"
          contentClassName="feed-tabs w-full"
        >
          {feedScopes.map(({ id: scope, label }, index) => (
            <button
              key={scope}
              id={`feed-tab-${scope}`}
              type="button"
              role="tab"
              aria-controls="feed-posts"
              aria-selected={value === scope}
              tabIndex={value === scope ? 0 : -1}
              onClick={() => onChange(scope)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`feed-tab ${value === scope ? "feed-tab-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </HorizontalScroller>
        <Button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Akışı yenile"
          title="Akışı yenile"
          variant="secondary"
          size="icon"
          className="nav-control"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} aria-hidden="true" />
        </Button>
      </div>
      {topics.length > 0 && (
        <div className="feed-topic-filter" role="group" aria-label="Akışı etikete göre süz">
          <span className="feed-topic-label"><Hash size={14} aria-hidden="true" /> Konular</span>
          <button
            type="button"
            aria-pressed={activeTopic === null}
            className={activeTopic === null ? "feed-topic-chip feed-topic-chip-active" : "feed-topic-chip"}
            onClick={() => onTopicChange(null)}
          >
            Tümü
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              aria-pressed={activeTopic === topic}
              className={activeTopic === topic ? "feed-topic-chip feed-topic-chip-active" : "feed-topic-chip"}
              onClick={() => onTopicChange(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
