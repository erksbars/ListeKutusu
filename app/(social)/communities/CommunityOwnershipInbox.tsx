"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { communityError, communityFetch } from "./communityFetch";
type Inbox = { offers: Array<{ id: string; community: { slug: string; name: string } }>; hasMore: boolean };
export function CommunityOwnershipInbox() {
  const [data, setData] = useState<Inbox | null>(null), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError("");
    communityFetch<Inbox>("/api/communities/ownership", undefined, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(error => { if (!controller.signal.aborted) { setData(null); setError(communityError(error)); } });
    return () => controller.abort();
  }, [retry]);
  if (!error && !data?.offers.length) return null;
  return <section className="ui-panel community-stack" aria-label="Gelen sahiplik teklifleri"><h2 className="ui-section-title">Gelen sahiplik teklifleri</h2>{error && <div role="alert"><p>{error}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Teklifleri yeniden yükle</Button></div>}{data?.offers.map(offer => <Link key={offer.id} href={`/communities/${offer.community.slug}`}>{offer.community.name} · Sahiplik teklifini incele ↗</Link>)}{data?.hasMore && <p>İlk 20 teklif gösteriliyor; diğer teklifleri ilgili toplulukta inceleyebilirsin.</p>}</section>;
}
