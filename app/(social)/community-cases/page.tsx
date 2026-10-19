import { CommunityCaseClient } from "@/app/components/communityCases/CommunityCaseClient";
import "../communities/communities.css";
export default async function Page({ searchParams }: { searchParams: Promise<{ community?: string }> }) {
  const params = await searchParams;
  return <CommunityCaseClient initialCommunity={typeof params.community === "string" ? params.community : ""} />;
}
