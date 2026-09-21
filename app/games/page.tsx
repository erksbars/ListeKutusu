"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock3, Dices, Gamepad2, LogIn, MousePointerClick, Play, Trophy, UsersRound } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { Toast } from "@/app/components/Toast";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { BackgammonMiniBoard } from "./components/BackgammonMiniBoard";
import { GamePageShell } from "./components/GamePageShell";
import { GameEmptyState } from "./components/GameEmptyState";
import { GameLoadingState } from "./components/GameLoadingState";
import { GameErrorState } from "./components/GameErrorState";
import type { GameAccount, GameDefinition, GameStats } from "./gameTypes";

type RecentSession = {
  id: string;
  gameCode: string;
  status: string;
  currentRound: number;
  targetSize: number;
  updatedAt: string;
  winner: { trackName: string; artistName: string } | null;
};

type PublicRoom = {
  id: string;
  gameCode: string;
  status: "waiting" | "active";
  updatedAt: string;
  owner: { ownerName: string; slug: string };
  playerNames: string[];
  playerCount: number;
  maxPlayers: number;
  isParticipant: boolean;
};

function gamePath(gameCode: string, sessionId?: string) {
  const base = gameCode === "backgammon" ? "/games/backgammon" : "/games/elimination";
  return sessionId ? `${base}/${sessionId}` : `${base}/new`;
}

function gameName(gameCode: string) {
  return gameCode === "backgammon" ? "Tavla" : "Şarkı Düellosu";
}

function GameIcon({ gameCode, size = 22 }: { gameCode: string; size?: number }) {
  return gameCode === "backgammon" ? <Dices size={size} /> : <Gamepad2 size={size} />;
}

function getSessionSummary(session: RecentSession) {
  if (session.status === "abandoned") return "Oda sona erdi";
  if (session.status === "completed") {
    return session.winner ? `Tamamlandı · ${session.winner.trackName}` : "Tamamlandı";
  }
  if (session.status === "waiting") return "Oyuncular bekleniyor";
  return `${session.currentRound}. tur devam ediyor`;
}

export default function GamesPage() {
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [stats, setStats] = useState<GameStats>({ completedGames: 0, activeGames: 0, totalChoices: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { goToLogin, logoutToHome } = useSessionNavigation();

  const loadGames = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/games");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Oyun merkezi yüklenemedi.");
      setAccount(data.account ?? null);
      setGames(Array.isArray(data.games) ? data.games : []);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setPublicRooms(Array.isArray(data.publicRooms) ? data.publicRooms : []);
      setStats(data.stats ?? { completedGames: 0, activeGames: 0, totalChoices: 0 });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Oyun merkezi yüklenemedi.";
      setLoadError(detail);
      setMessage(detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadGames(); }, [loadGames]);

  return (
    <>
      <Toast message={message} onClose={() => setMessage(null)} />
      <GamePageShell
        title="Oyunlar"
        subtitle="Müzik seçimlerini küçük mücadelelere dönüştür."
        icon={<Gamepad2 size={20} />}
        backHref="/"
        maxWidth="wide"
        actions={account ? <AccountMenu {...account} profileSlug={account.slug} onLogout={() => void logoutToHome()} /> : (
            <button type="button" onClick={() => goToLogin("/games")} className="secondary-action ui-button-sm"><LogIn size={16} /> Giriş yap</button>
        )}
      >

        {!loading && loadError ? (
          <GameErrorState
            title="Oyun merkezi açılamadı"
            description={`${loadError} Bağlantını kontrol edip yeniden deneyebilirsin.`}
            onRetry={() => void loadGames()}
            backHref="/"
            backLabel="Ana akışa dön"
          />
        ) : null}

        {!loadError && <><section className="games-intro-band">
          <div>
            <p className="section-kicker">Topluluk oyunları</p>
            <h2>Masaya katıl, rekabete ritim kat.</h2>
            <p>Şarkı eşleştirmelerinden klasik tavlaya uzanan kısa oturumlarda arkadaşlarınla aynı odada buluş.</p>
          </div>
          <div className="games-intro-stats" aria-label="Oyun özellikleri">
            <span><Gamepad2 size={16} /><strong>{games.length || 2} oyun</strong><small>aktif katalog</small></span>
            <span><UsersRound size={16} /><strong>2 veya 4</strong><small>oyuncu</small></span>
            <span><Trophy size={16} /><strong>Canlı odalar</strong><small>katıl veya izle</small></span>
          </div>
        </section>

        <section className="games-section">
          <div className="games-section-heading"><div><p className="section-kicker">Oynamaya hazır</p><h2>Oyunlar</h2></div></div>
          <div className="games-catalog">
            {loading && <GameLoadingState label="Oyunlar hazırlanıyor..." />}
            {games.map((game) => (
              <article key={game.code} className="game-catalog-card" data-game={game.code}>
                <div className="game-catalog-heading">
                  <span className="game-catalog-icon"><GameIcon gameCode={game.code} /></span>
                  <span className="game-catalog-status">Oynamaya hazır</span>
                </div>
                <div className="game-catalog-copy min-w-0">
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <div className="game-catalog-meta"><span>{game.mode}</span><span>{game.duration}</span><span>{game.source}</span></div>
                </div>
                <div className="game-catalog-visual">
                  {game.code === "backgammon" ? <BackgammonMiniBoard compact /> : (
                    <div className="game-duel-preview" aria-hidden="true">
                      <span><i /><i /><i /><strong>A</strong></span><b>VS</b><span><i /><i /><i /><strong>B</strong></span>
                    </div>
                  )}
                </div>
                {account ? (
                  <Link href={gamePath(game.code)} className="primary-action game-catalog-action"><Play size={16} /> Oyunu aç <ArrowRight size={15} /></Link>
                ) : (
                  <button type="button" onClick={() => goToLogin(gamePath(game.code))} className="primary-action game-catalog-action"><LogIn size={16} /> Giriş yap <ArrowRight size={15} /></button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="games-section">
          <div className="games-section-heading"><div><p className="section-kicker">Topluluk</p><h2>Aktif odalar</h2></div><small>Özel odalar burada gösterilmez.</small></div>
          {publicRooms.length > 0 ? (
            <div className="game-room-grid">
              {publicRooms.map((room) => (
                <Link key={room.id} href={gamePath(room.gameCode, room.id)} className="game-room-card" data-game={room.gameCode} data-status={room.status}>
                  <span className={room.status === "active" ? "is-live" : ""}><UsersRound size={18} /></span>
                  <div>
                    <small>{room.status === "active" ? `Canlı ${gameName(room.gameCode)}` : `${gameName(room.gameCode)} · oyuncu bekliyor`}</small>
                    <strong>{room.playerNames.join(" · ") || room.owner.ownerName}</strong>
                    <div className="game-room-participants">
                      <span>{(room.playerNames.length ? room.playerNames : [room.owner.ownerName]).slice(0, 3).map((name, index) => <i key={`${name}-${index}`}>{name.slice(0, 1).toLocaleUpperCase("tr-TR")}</i>)}</span>
                      <p>{room.playerCount}/{room.maxPlayers} oyuncu · {room.isParticipant ? "Senin odan" : room.status === "waiting" ? "Katılabilirsin" : "İzleyebilirsin"}</p>
                    </div>
                  </div>
                  <b>{room.status === "waiting" ? "Katıl" : "İzle"}<ArrowRight size={14} /></b>
                </Link>
              ))}
            </div>
          ) : <GameEmptyState icon={<UsersRound size={22} />} title="Şu anda herkese açık oda yok" description="Yeni düellolar varsayılan olarak burada görünür. Özel açılan odalar yalnız davet bağlantısıyla bulunur." />}
        </section>

        {account && (
          <section className="games-section">
            <div className="game-personal-stats" aria-label="Kişisel oyun istatistikleri">
              <article><span><Trophy size={18} /></span><div><strong>{stats.completedGames}</strong><small>Tamamlanan oyun</small></div></article>
              <article><span><MousePointerClick size={18} /></span><div><strong>{stats.totalChoices}</strong><small>Yapılan seçim</small></div></article>
              <article><span><Clock3 size={18} /></span><div><strong>{stats.activeGames}</strong><small>Devam eden oturum</small></div></article>
            </div>
            <div className="games-section-heading"><div><p className="section-kicker">Oyun geçmişin</p><h2>Son oturumlar</h2></div></div>
            {sessions.length > 0 ? (
              <div className="game-session-list">
                {sessions.map((session) => (
                  <Link key={session.id} href={gamePath(session.gameCode, session.id)} className="game-session-row">
                    <span className={session.status === "completed" ? "is-complete" : ""}><Trophy size={17} /></span>
                    <div className="min-w-0"><strong>{gameName(session.gameCode)}</strong><small>{getSessionSummary(session)}</small></div>
                    <time>{new Date(session.updatedAt).toLocaleDateString("tr-TR")}</time>
                  </Link>
                ))}
              </div>
            ) : (
              <GameEmptyState icon={<Gamepad2 size={22} />} title="Henüz oyun geçmişin yok" description="İlk oyun odana katıldığında oturum burada görünecek." />
            )}
          </section>
        )}</>}
      </GamePageShell>
    </>
  );
}
