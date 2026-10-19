import { CommunityDirectory } from "./CommunityDirectory";
import { discoveryFiltersFromParams } from "@/lib/communityDiscoveryTypes";
export const metadata = { title: "Topluluklar | ListeKutusu" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams, params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === "string") params.set(key, value);
  return <CommunityDirectory initialFilters={discoveryFiltersFromParams(params)} />;
}
