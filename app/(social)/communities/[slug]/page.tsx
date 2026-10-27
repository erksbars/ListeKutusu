import { CommunityClient } from "../CommunityClient";
import { communityNavigationFromParams } from "@/lib/communityNavigation";
import { communityFeedReturn } from "@/lib/feedNavigation";
export const metadata = { title: "Topluluk | ListeKutusu" };
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const query = await searchParams;
  const paramsQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") paramsQuery.set(key, value);
    else if (Array.isArray(value) && value[0]) paramsQuery.set(key, value[0]);
  }
  return <CommunityClient key={slug} slug={slug} initialNavigation={communityNavigationFromParams(paramsQuery)} initialFeedReturnTo={communityFeedReturn(paramsQuery)} />;
}
