"use client";

import Link from "next/link";
import { AchievementProgress } from "./AchievementProgress";

type HomeCommunitySummaryProps = {
  authenticated: boolean;
  rank?: number | null;
  score?: number | null;
  onMessage: (message: string) => void;
};

/** Feed context only: app-wide navigation belongs to AppShell. */
export function HomeCommunitySummary({ authenticated, rank, score, onMessage }: HomeCommunitySummaryProps) {
  return <section className="home-personal-context ui-panel hidden lg:block" aria-label="Kişisel topluluk özeti">
    <h2 className="ui-section-title">Bu ay</h2>
    {rank ? <><p className="mt-2 text-2xl font-bold">#{rank}</p><p className="text-sm text-muted">{score ?? "—"} topluluk puanı</p></> : <p className="mt-2 text-sm text-muted">Paylaşım yaptıkça sıralamadaki yerin burada görünür.</p>}
    {authenticated && <AchievementProgress onMessage={onMessage} />}
    <Link href="/suggest" className="mt-3 inline-flex text-sm">Bir listeye şarkı öner</Link>
  </section>;
}
