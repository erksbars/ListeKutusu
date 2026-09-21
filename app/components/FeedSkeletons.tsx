export function FeedSkeletons() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div
      key={`feed-skeleton-${index}`}
      className="feed-skeleton-card min-h-44 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <span className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="h-3 w-32 rounded-full" />
          <div className="mt-5 h-6 w-2/3 rounded-full" />
          <div className="mt-3 h-3 w-44 rounded-full" />
        </div>
      </div>
      <div className="mt-5 h-11 rounded-xl" />
    </div>
  ));
}
