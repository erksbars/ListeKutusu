export type TimelineKind = "music" | "post" | "event";
export type TimelinePosition = { id: string; kind: TimelineKind; createdAt: string };

export function compareTimelineItems(a: TimelinePosition, b: TimelinePosition) {
  return b.createdAt.localeCompare(a.createdAt) || (a.kind === b.kind ? (a.id === b.id ? 0 : a.id < b.id ? 1 : -1) : a.kind < b.kind ? 1 : -1);
}
