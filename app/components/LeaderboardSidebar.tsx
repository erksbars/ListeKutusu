"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DailyRhythm } from "./DailyRhythm";

type RankedUser = {
  id: string;
  rank: number;
  ownerName: string;
  playlistName: string | null;
  score: number;
  socialLikes: number;
  socialAdds: number;
};

type RankedTrack = {
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  postId: string;
  adds: number;
  likes: number;
  rank: number;
};

type LeaderboardData = {
  totals: {
    participants: number;
    socialLikes?: number;
    socialAdds?: number;
  };
  users: RankedUser[];
  tracks: RankedTrack[];
} | null;

type LeaderboardSidebarProps = {
  leaderboard: LeaderboardData;
  onRefresh: () => void;
  authenticated: boolean;
};

export function LeaderboardSidebar({ leaderboard, onRefresh, authenticated }: LeaderboardSidebarProps) {
  const maxTrackAdds = Math.max(1, ...(leaderboard?.tracks ?? []).map((track) => track.adds));

  return (
    <aside id="community-rankings" className="grid scroll-mt-24 gap-4 xl:sticky xl:top-24" aria-label="Topluluk sıralamaları">
      <div className="dashboard-panel leaderboard-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Ayın parçaları</p>
            <h2 className="mt-1 text-lg font-black text-navy">En çok listeye eklenenler</h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-bold text-sky-700 hover:bg-sky-50 hover:text-navy xl:hidden"
          >
            Yenile
          </button>
        </div>
        <div className="mt-4 divide-y divide-slate-200/80 border-y border-slate-200/80">
          {(leaderboard?.tracks ?? []).slice(0, 4).map((track) => {
            const content = (
              <>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-xs font-black text-cyan-800">
                  {track.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-navy">{track.trackName}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{track.artistName}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-sky-100">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      style={{ width: `${Math.max(12, (track.adds / maxTrackAdds) * 100)}%` }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <strong className="block text-sm font-black text-emerald-700">{track.adds}</strong>
                  <span className="text-xs font-semibold text-slate-400">ekleme</span>
                </span>
              </>
            );

            return track.externalUrl ? (
              <a
                key={track.trackId}
                href={track.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-3 px-1 py-3.5 transition hover:bg-white/60"
              >
                {content}
              </a>
            ) : (
              <div key={track.trackId} className="flex min-w-0 items-center gap-3 px-1 py-3.5">
                {content}
              </div>
            );
          })}
          {(leaderboard?.tracks?.length ?? 0) === 0 && (
            <p className="py-4 text-sm leading-6 text-slate-500">
              Şarkılar kişisel listelere eklendikçe ayın öne çıkanları burada görünür.
            </p>
          )}
        </div>
      </div>

      {authenticated && <div className="hidden xl:block"><DailyRhythm /></div>}
      {!authenticated && (
        <div className="sticky-panel hidden rounded-2xl p-5 xl:block">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-100/75">Kişisel akış</p>
          <h2 className="mt-2 text-lg font-bold text-white">Keşiflerini kaybetme</h2>
          <p className="mt-2 text-sm leading-6 text-cyan-50/75">Beğenmek, listene eklemek ve kişisel öneriler almak için hesabına gir.</p>
          <Link href="/account?mode=login" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">
            Giriş yap <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </aside>
  );
}
