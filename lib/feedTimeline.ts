import { CommunityError } from "./communityError.ts";
import type { TimelineKind, TimelinePosition } from "./feedTimelineOrder.ts";

export function parseTimelineCursor(raw: string | null): TimelinePosition | null {
  if (!raw) return null;
  try {
    if (raw.length > 400 || !/^[\w-]+$/.test(raw)) throw new Error();
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const createdAt = value?.createdAt ?? value?.at;
    if (!value || !["music", "post", "event"].includes(value.kind) || typeof value.id !== "string" || !/^[\w-]{1,100}$/.test(value.id) || typeof createdAt !== "string" || new Date(createdAt).toISOString() !== createdAt) throw new Error();
    return { createdAt, id: value.id, kind: value.kind };
  } catch { throw new CommunityError("Geçersiz akış konumu."); }
}
export function timelineBefore(cursor: TimelinePosition | null, kind: TimelineKind) {
  if (!cursor) return {};
  const at = new Date(cursor.createdAt);
  return { OR: [{ createdAt: { lt: at } }, ...(kind < cursor.kind ? [{ createdAt: at }] : kind === cursor.kind ? [{ createdAt: at, id: { lt: cursor.id } }] : [])] };
}
export function timelineCursor(item: TimelinePosition) {
  return Buffer.from(JSON.stringify({ createdAt: item.createdAt, id: item.id, kind: item.kind })).toString("base64url");
}
