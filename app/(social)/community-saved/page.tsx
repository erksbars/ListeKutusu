import { CommunitySavedClient } from "./CommunitySavedClient";
import { communityNavigationFromParams } from "@/lib/communityNavigation";
import "../communities/communities.css";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams, params = new URLSearchParams();
  for (const key of ["page", "postType", "reviewKind"]) if (typeof raw[key] === "string") params.set(key, raw[key]);
  const { page, postType, reviewKind } = communityNavigationFromParams(params);
  return <CommunitySavedClient page={page} postType={postType} reviewKind={reviewKind} />;
}
