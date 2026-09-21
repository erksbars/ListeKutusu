"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, Gamepad2, Hourglass, RefreshCw, Share2, Trophy, UserPlus, UserRound } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { Toast } from "@/app/components/Toast";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { GameTrackPicker, type GameCandidate } from "@/app/(social)/games/components/GameTrackPicker";
import { GamePageShell } from "@/app/(social)/games/components/GamePageShell";
import { GameStatusPanel } from "@/app/(social)/games/components/GameStatusPanel";
import { GameEmptyState } from "@/app/(social)/games/components/GameEmptyState";
import { GameLoadingState } from "@/app/(social)/games/components/GameLoadingState";
import { GamePlayerSlot } from "@/app/(social)/games/components/GamePlayerSlot";
import { GameInviteActions } from "@/app/(social)/games/components/GameInviteActions";
import { GameEventLog } from "@/app/(social)/games/components/GameEventLog";
import { GameErrorState } from "@/app/(social)/games/components/GameErrorState";
import { GameConnectionBadge, type GameConnectionState } from "@/app/(social)/games/components/GameConnectionBadge";
import { useVisiblePolling } from "@/app/(social)/games/hooks/useVisiblePolling";
import { YouTubeMatchPreview } from "@/app/(social)/games/components/YouTubeMatchPreview";
import type { EliminationSession, GameAccount, GameOwner } from "@/app/(social)/games/gameTypes";

export default function EliminationSessionPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<EliminationSession | null>(null);
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [owner, setOwner] = useState<GameOwner | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [canJoin, setCanJoin] = useState(false);
  const [joinCandidates, setJoinCandidates] = useState<GameCandidate[]>([]);
  const [joinSelection, setJoinSelection] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<GameConnectionState>("syncing");
  const latestEtag = useRef("");
  const requestSequence = useRef(0);
  const roomAbortController = useRef<AbortController | null>(null);
  const { goToLogin, logoutToHome } = useSessionNavigation();

  const loadSession = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setLoadError(null);
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    roomAbortController.current?.abort();
    const controller = new AbortController();
    roomAbortController.current = controller;
    if (!silent) setConnectionState("syncing");
    try {
      const headers = new Headers();
      if (latestEtag.current) headers.set("If-None-Match", latestEtag.current);
      const response = await fetch(`/api/games/elimination/${params.id}`, { cache: "no-store", headers, signal: controller.signal });
      if (response.status === 304) {
        setConnectionState("connected");
        return;
      }
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        goToLogin(`/games/elimination/${params.id}`);
        return;
      }
      if (!response.ok) throw new Error(data?.error || "Oyun yüklenemedi.");
      if (sequence !== requestSequence.current) return;
      latestEtag.current = response.headers.get("etag") || `"game-${params.id}-${data.session.revision}-${data.session.status}"`;
      setSession(data.session);
      setAccount(data.account);
      setOwner(data.owner ?? null);
      setIsOwner(Boolean(data.isOwner));
      setCanJoin(Boolean(data.canJoin));
      setJoinCandidates(Array.isArray(data.joinCandidates) ? data.joinCandidates : []);
      setConnectionState("connected");
    } catch (error) {
      if (controller.signal.aborted) return;
      const detail = error instanceof Error ? error.message : "Oyun yüklenemedi.";
      setConnectionState("reconnecting");
      if (!silent) {
        setMessage(detail);
        setLoadError(detail);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [goToLogin, params.id]);

  useEffect(() => { void loadSession(); }, [loadSession]);
  useEffect(() => () => roomAbortController.current?.abort(), []);
  useVisiblePolling({
    enabled: Boolean(session && !["completed", "abandoned"].includes(session.status) && !canJoin && !voting),
    intervalMs: 3_000,
    onPoll: () => loadSession(true),
  });

  const entryMap = useMemo(() => new Map(session?.entries.map((entry) => [entry.id, entry]) ?? []), [session]);
  const currentRound = session?.bracket?.rounds.find((round) => round.number === session.bracket?.currentRound);
  const currentMatchup = currentRound?.matchups.find((matchup) => !matchup.winnerEntryId) ?? null;
  const completedVotes = session?.bracket?.rounds.reduce((sum, round) => sum + round.matchups.filter((matchup) => matchup.winnerEntryId).length, 0) ?? 0;
  const requiredChoices = session?.choicesRequired || 3;
  const viewerPlayer = session?.players.find((player) => player.isViewer) ?? null;
  const opponent = session?.players.find((player) => !player.isViewer) ?? null;
  const isDuel = (session?.gameVersion ?? 1) >= 2;
  const isContributionDuel = (session?.gameVersion ?? 1) >= 3;
  const isSharedPoolDuel = (session?.gameVersion ?? 1) >= 4;
  const options = currentMatchup
    ? [entryMap.get(currentMatchup.entryAId), entryMap.get(currentMatchup.entryBId)].filter((track): track is NonNullable<typeof track> => Boolean(track))
    : [];

  async function choose(selectedEntryId: string) {
    if (!currentMatchup || voting || session?.viewerHasVotedCurrent) return;
    roomAbortController.current?.abort();
    requestSequence.current += 1;
    setVoting(true);
    setConnectionState("syncing");
    try {
      const response = await fetch(`/api/games/elimination/${params.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchupNumber: currentMatchup.number, selectedEntryId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Seçim kaydedilemedi.");
      setSession(data.session);
      latestEtag.current = `"game-${params.id}-${data.session.revision}-${data.session.status}"`;
      setConnectionState("connected");
      if (data.session?.viewerHasVotedCurrent) setMessage("Oyun kaydedildi. Diğer oyuncular bekleniyor.");
      if (data.session?.status === "completed") window.dispatchEvent(new Event("achievement:refresh"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seçim kaydedilemedi.");
      setConnectionState("reconnecting");
      await loadSession(true);
    } finally {
      setVoting(false);
    }
  }

  async function joinDuel() {
    if (joining || joinSelection.length !== 4) return;
    roomAbortController.current?.abort();
    requestSequence.current += 1;
    setJoining(true);
    setConnectionState("syncing");
    try {
      const response = await fetch(`/api/games/elimination/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds: joinSelection }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        goToLogin(`/games/elimination/${params.id}`);
        return;
      }
      if (!response.ok) throw new Error(data?.error || "Düelloya katılamadın.");
      setSession(data.session);
      latestEtag.current = `"game-${params.id}-${data.session.revision}-${data.session.status}"`;
      setCanJoin(false);
      setConnectionState("connected");
      setMessage(data.session?.status === "active" ? "Oda doldu, turnuva başladı." : "Seçkin odaya eklendi. Diğer oyuncular bekleniyor.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Düelloya katılamadın.");
      setConnectionState("reconnecting");
      await loadSession(true);
    } finally {
      setJoining(false);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Davet bağlantısı kopyalandı.");
    } catch {
      setMessage("Davet bağlantısı kopyalanamadı.");
    }
  }

  async function shareResult() {
    if (!session || session.status !== "completed") return;
    const url = window.location.href;
    const title = "Şarkı Düellosu sonuçlandı";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: "Herkes dörder şarkı getirdi; oda favorisini birlikte seçtik.", url });
        setMessage("Oyun sonucu paylaşıldı.");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Oyun bağlantısı kopyalandı.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Oyun bağlantısı kopyalanamadı.");
    }
  }

  return (
    <>
      <Toast message={message} onClose={() => setMessage(null)} />
      <GamePageShell title={isDuel ? "Şarkı Düellosu" : "Şarkı Elemesi"} subtitle={session?.gameVersion && session.gameVersion >= 5 ? "Herkes oy verir, eşleşme birlikte ilerler." : isSharedPoolDuel ? "Dörder şarkı getir, aynı eşleşmelerde favorini bul." : isContributionDuel ? "Dörder şarkı getir, rakibinin seçkisinden favorini bul." : "İki kişilik müzik karşılaştırması"} icon={<Gamepad2 size={20} />} actions={account ? <AccountMenu {...account} profileSlug={account.slug} onLogout={() => void logoutToHome()} /> : null}>

        {!loading && session && isDuel && (
          <section className="game-duel-lobby">
            <div className="game-duel-player-grid">
              {Array.from({ length: session.maxPlayers }, (_, index) => index + 1).map((seat) => {
                const player = session.players.find((item) => item.seat === seat);
                const playerName = player?.ownerName || (seat === 1 ? owner?.ownerName : null);
                const ready = Boolean(player?.completed || player?.hasVotedCurrent);
                return <GamePlayerSlot key={seat} seat={seat} name={playerName} ready={ready} label={`${seat}. oyuncu${player?.hasVotedCurrent ? " · oy verdi" : ""}`} />;
              })}
            </div>
            {session.status !== "completed" && (
              <div className="game-duel-lobby-actions">
                <GameConnectionBadge state={connectionState} />
                {(viewerPlayer || isOwner) && <button type="button" onClick={() => void copyInviteLink()} className="secondary-action ui-button-sm"><Copy size={15} /> Davet bağlantısı</button>}
                <button type="button" onClick={() => void loadSession()} className="ui-icon-button" aria-label="Düello durumunu yenile" title="Durumu yenile"><RefreshCw size={15} /></button>
              </div>
            )}
          </section>
        )}

        {!loading && session && isDuel && session.events.length > 0 && (
          <GameEventLog events={session.events} />
        )}

        {loading ? (
          <GameLoadingState label="Oyun hazırlanıyor..." className="mt-8" />
        ) : !session && loadError ? (
          <GameErrorState description={`${loadError} Oda artık etkin olmayabilir; yeniden deneyebilir veya oyun merkezine dönebilirsin.`} onRetry={() => void loadSession()} />
        ) : canJoin && session ? (
          <section className="game-join-layout">
            <div className="game-track-picker">
              <div className="game-track-picker-heading">
              <div><p className="section-kicker">Düello daveti · {session.players.length}/{session.maxPlayers} oyuncu</p><h2>Kendi 4 şarkını seç</h2><p>Parçaların odadaki diğer seçkilerle birleşecek; oda dolunca herkes aynı {session.targetSize} şarkılık turnuvayı görecek.</p></div>
                <strong>{joinSelection.length}/4</strong>
              </div>
              <GameTrackPicker candidates={joinCandidates} selected={joinSelection} onChange={setJoinSelection} emptyText="Katılmak için listende veya paylaşımlarında rakibinden farklı en az dört parça olmalı." />
            </div>
            <aside className="game-join-summary">
              <span><UserPlus size={25} /></span>
              <p className="section-kicker">Nasıl oynanır?</p>
              <h2>Ortak havuz, kilitli aşamalar.</h2>
              <ol><li>Dört parçanı seç.</li><li>{session.maxPlayers} oyuncunun dolmasını bekle.</li><li>Herkes oy verince birlikte ilerle.</li></ol>
              <button type="button" onClick={() => void joinDuel()} disabled={joining || joinSelection.length !== 4} className="primary-action ui-button-lg w-full"><UserPlus size={17} /> {joining ? "Seçkin ekleniyor..." : "Seçkini odaya ekle"}</button>
            </aside>
          </section>
        ) : session?.status === "abandoned" ? (
          <GameStatusPanel
            icon={<Hourglass size={28} />}
            kicker="Oda sona erdi"
            title="Bu oyun artık etkin değil."
            description="Bekleyen odalar 15 dakika, başlamış oyunlar 30 dakika işlem yapılmadığında kapanır. Aynı seçkiyle yeni bir oda açabilirsin."
            tone="warning"
            actions={<><Link href="/games/elimination/new" className="primary-action ui-button-md">Yeni oda oluştur</Link><Link href="/games" className="secondary-action ui-button-md">Oyun merkezine dön</Link></>}
          />
        ) : session?.status === "completed" && session.gameVersion >= 5 ? (
          <section className="game-group-result">
            <div className="game-group-winner"><span><Trophy size={28} /></span><p className="section-kicker">Oda favorisi</p><h2>{session.winnerEntryId ? entryMap.get(session.winnerEntryId)?.trackName : "Turnuva tamamlandı"}</h2><p>{session.winnerEntryId ? entryMap.get(session.winnerEntryId)?.artistName : ""}</p></div>
            {session.compatibility && <div className="game-compatibility-score"><small>Karar uyumu</small><strong>%{session.compatibility.percentage}</strong><span>{session.compatibility.matching}/{session.compatibility.compared} ortak seçim</span></div>}
            <div className="game-result-players">{session.players.map((player) => <Link key={player.id} href={`/u/${player.slug}`}><UserRound size={14} /> {player.ownerName}</Link>)}</div>
            <div className="game-result-actions"><button type="button" onClick={() => void shareResult()} className="primary-action ui-button-md"><Share2 size={16} /> Sonucu paylaş</button><Link href="/games/elimination/new" className="secondary-action ui-button-md">Yeni oda oluştur</Link><Link href="/games" className="secondary-action ui-button-md">Oyun merkezine dön</Link></div>
          </section>
        ) : session?.status === "completed" && isDuel && session.players.length === 2 ? (
          <section className="game-duel-result">
            <div className="game-result-heading"><span><Trophy size={24} /></span><div><p className="section-kicker">Düello tamamlandı</p><h2>Birbirinizin seçkisinden favorileriniz</h2></div></div>
            {session.compatibility && <div className="game-compatibility-score"><small>Karar uyumu</small><strong>%{session.compatibility.percentage}</strong><span>{session.compatibility.matching}/{session.compatibility.compared} ortak seçim</span></div>}
            <div className="game-duel-champions">
              {session.players.map((player) => {
                const champion = player.winnerEntryId ? entryMap.get(player.winnerEntryId) : null;
                return (
                  <article key={player.id}>
                    <span><Trophy size={20} /></span>
                    <small>{player.ownerName} ortak sekizliden seçti</small>
                    <h2>{champion?.trackName || "Sonuç bekleniyor"}</h2>
                    <p>{champion?.artistName || ""}</p>
                    <Link href={`/u/${player.slug}`}>{player.ownerName} profilini aç</Link>
                  </article>
                );
              })}
            </div>
            <div className="game-result-actions">
              <button type="button" onClick={() => void shareResult()} className="primary-action ui-button-md"><Share2 size={16} /> Sonucu paylaş</button>
              <Link href="/games/elimination/new" className="secondary-action ui-button-md">Yeni düello oluştur</Link>
              <Link href="/games" className="secondary-action ui-button-md">Oyun merkezine dön</Link>
            </div>
          </section>
        ) : session?.viewerCompleted ? (
          <GameStatusPanel
            icon={<Hourglass size={28} />}
            kicker="Sen tamamladın"
            title={opponent ? `${opponent.ownerName} kendi favorisini belirliyor.` : "Rakibin henüz düelloya katılmadı."}
            description="Favorin, diğer oyuncu da kararlarını tamamladığında birlikte açıklanacak. Sayfa otomatik yenileniyor."
            actions={<button type="button" onClick={() => void loadSession()} className="secondary-action ui-button-md"><RefreshCw size={16} /> Durumu yenile</button>}
          />
        ) : session?.status === "waiting" && viewerPlayer ? (
          <GameStatusPanel
            icon={<Hourglass size={28} />}
            kicker="Seçkin hazır"
            title={`${session.players.length}/${session.maxPlayers} oyuncu hazır.`}
            description={`Davet bağlantısını gönder. Bütün koltuklar dolduğunda ${session.targetSize} şarkılık turnuva herkeste aynı anda açılacak.`}
            actions={<GameInviteActions onCopy={() => void copyInviteLink()} onRefresh={() => void loadSession()} copyLabel="Daveti kopyala" />}
          />
        ) : currentMatchup && options.length === 2 && !viewerPlayer && session?.status === "active" ? (
          <section className="game-play-area game-spectator-area">
            <div className="game-progress-heading"><div><p className="section-kicker">Canlı oda</p><h2>Şu anki eşleşme</h2></div><strong>{session.matchupVoteCount}/{session.maxPlayers} oy</strong></div>
            <div className="game-matchup-grid">
              {options.map((track, index) => <article key={track.id} className="game-choice-card"><YouTubeMatchPreview track={track} /><div className="game-choice-copy"><span>{index === 0 ? "A" : "B"}</span><div><h3>{track.trackName}</h3><p>{track.artistName}</p></div></div>{index === 0 && <i className="game-matchup-versus">VS</i>}</article>)}
            </div>
          </section>
        ) : session && currentMatchup && options.length === 2 && viewerPlayer ? (
          <section className="game-play-area">
            <div className="game-progress-heading">
              <div><p className="section-kicker">{currentRound?.matchups.length === 1 ? "Final" : `${session?.currentRound}. tur`}</p><h2>Aynı eşleşmede hangisi devam etsin?</h2></div>
              <strong>{completedVotes}/{requiredChoices} eşleşme · {session.matchupVoteCount}/{session.maxPlayers} oy</strong>
            </div>
            <div className="game-progress-track"><span style={{ width: `${Math.min(100, (completedVotes / requiredChoices) * 100)}%` }} /></div>
            {session.viewerHasVotedCurrent && <div className="game-vote-waiting"><Hourglass size={16} /><span>Seçimin kaydedildi.</span><strong>{session.maxPlayers - session.matchupVoteCount} oyuncu bekleniyor</strong></div>}
            <div className="game-matchup-grid">
              {options.map((track, index) => (
                <article key={track.id} className="game-choice-card">
                  <YouTubeMatchPreview track={track} />
                  <div className="game-choice-copy"><span>{index === 0 ? "A" : "B"}</span><div><h3>{track.trackName}</h3><p>{track.artistName}</p></div></div>
                  <button type="button" disabled={voting || session.viewerHasVotedCurrent} onClick={() => choose(track.id)} className="primary-action ui-button-lg w-full">{voting ? "Kaydediliyor..." : session.viewerHasVotedCurrent ? "Oy verildi" : "Bu şarkı devam etsin"}</button>
                  {index === 0 && <i className="game-matchup-versus">VS</i>}
                </article>
              ))}
            </div>
          </section>
        ) : (
          <GameEmptyState className="mt-8" icon={<Gamepad2 size={22} />} title="Oyun durumu hazırlanamadı" description="Sayfayı yenileyerek düello durumunu tekrar kontrol et." />
        )}
      </GamePageShell>
    </>
  );
}
