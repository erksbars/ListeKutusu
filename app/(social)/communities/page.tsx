import { redirect } from "next/navigation";
import { searchPath } from "@/lib/socialSearchTypes";
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  redirect(typeof q === "string" && q.trim() ? searchPath(q) : "/");
}
