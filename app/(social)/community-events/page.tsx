import { agendaFilters } from "@/lib/communityAgendaFilters";
import { CommunityAgendaClient } from "./CommunityAgendaClient";
import "../communities/communities.css";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams, params = new URLSearchParams();
  for (const key of ["page", "view", "role"]) if (typeof raw[key] === "string") params.set(key, raw[key]);
  return <CommunityAgendaClient {...agendaFilters(params)} />;
}
