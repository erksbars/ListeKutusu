import { REVIEW_KINDS } from "./communityTypes.ts";
export type PostTypeFilter = "all" | "discussion" | "review";
export type ReviewKindFilter = "all" | keyof typeof REVIEW_KINDS;
export function readPostFilters(type: string | null | undefined, kind: string | null | undefined) {
  const postType: PostTypeFilter = type === "discussion" || type === "review" ? type : "all";
  const reviewKind: ReviewKindFilter = postType === "review" && kind && Object.hasOwn(REVIEW_KINDS, kind) ? kind as keyof typeof REVIEW_KINDS : "all";
  return { postType, reviewKind };
}
export function validPostFilters(type: string, kind: string) {
  return ["all", "discussion", "review"].includes(type) && (kind === "all" || (type === "review" && Object.hasOwn(REVIEW_KINDS, kind)));
}
