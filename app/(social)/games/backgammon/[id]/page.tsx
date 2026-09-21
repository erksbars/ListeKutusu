"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CircleSlash2, Copy, Dices, Eye, LogIn, Plus, RefreshCw, Share2, Trash2, Trophy, UsersRound } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { Toast } from "@/app/components/Toast";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { BackgammonBoard } from "@/app/(social)/games/components/BackgammonBoard";
import { GamePageShell } from "@/app/(social)/games/components/GamePageShell";
import { GameStatusPanel } from "@/app/(social)/games/components/GameStatusPanel";
import { GameLoadingState } from "@/app/(social)/games/components/GameLoadingState";
import { GamePlayerSlot } from "@/app/(social)/games/components/GamePlayerSlot";
import { GameInviteActions } from "@/app/(social)/games/components/GameInviteActions";
import { GameEventLog } from "@/app/(social)/games/components/GameEventLog";
import { GameErrorState } from "@/app/(social)/games/components/GameErrorState";
import { useVisiblePolling } from "@/app/(social)/games/hooks/useVisiblePolling";
import type { BackgammonSession, GameAccount } from "@/app/(social)/games/gameTypes";

type RoomResponse = {
  account: GameAccount | null;
  canJoin: boolean;
  requiresLogin: boolean;
  session: BackgammonSession;
};

type BackgammonAction =
  | { type: "roll" }
  | { type: "point"; point: number | "bar" | "off_board" }
  | { type: "move"; from: number | "bar"; to: number | "off_board" }
  | { type: "cancel" }
  | { type: "resign" }
  | { type: "pass" };

export default function BackgammonRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [session, setSession] = useState<BackgammonSession | null>(null);
  const [canJoin, setCanJoin] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [connectionState, setConnectionState] = useState<"connected" | "syncing" | "reconnecting">("syncing");
  const requestSequence = useRef(0);
  const roomAbortController = useRef<AbortController | null>(null);
  const latestUpdatedAt = useRef("");
  const latestRevision = useRef<number | null>(null);
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const roomStatus = session?.status;

  const loadRoom = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    roomAbortController.current?.abort();
    const controller = new AbortController();
    roomAbortController.current = controller;
    if (!quiet) setConnectionState("syncing");
    if (!quiet) setLoadError(null);
    try {
      const headers = new Headers();
      if (latestRevision.current !== null && session?.status) {
        headers.set("If-None-Match", `"game-${id}-${latestRevision.current}-${session.status}"`);
      }
      const response = await fetch(`/api/games/backgammon/${id}`, { cache: "no-store", signal: controller.signal, headers });
      if (response.status === 304) {
        setConnectionState("connected");
        return;
      }
      const data = await response.json().catch(() => null) as RoomResponse | { error?: string } | null;
      if (!response.ok) throw new Error(data && "error" in data ? data.error || "Tavla odası yüklenemedi." : "Tavla odası yüklenemedi.");
      if (sequence !== requestSequence.current) return;
      const room = data as RoomResponse;
      const incomingTime = Date.parse(room.session.updatedAt);
      const currentTime = Date.parse(latestUpdatedAt.current);
      if (latestUpdatedAt.current && Number.isFinite(currentTime) && incomingTime < currentTime) return;
      latestUpdatedAt.current = room.session.updatedAt;
      latestRevision.current = room.session.revision;
      setAccount(room.account ?? null);
      setSession(room.session);
      setCanJoin(room.canJoin);
      setRequiresLogin(room.requiresLogin);
      setConnectionState("connected");
    } catch (error) {
      if (controller.signal.aborted) return;
      setConnectionState("reconnecting");
      if (!quiet) {
        const detail = error instanceof Error ? error.message : "Tavla odası yüklenemedi.";
        setLoadError(detail);
        setMessage(detail);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [id, session?.status]);

  useEffect(() => { void loadRoom(); }, [loadRoom]);
  useEffect(() => () => roomAbortController.current?.abort(), []);
  useVisiblePolling({
    enabled: Boolean(roomStatus && !["completed", "abandoned"].includes(roomStatus) && !busy),
    intervalMs: 2_500,
    onPoll: () => loadRoom(true),
  });

  async function joinRoom() {
    if (!account) return goToLogin(`/games/backgammon/${id}`);
    setBusy(true);
    try {
      const response = await fetch(`/api/games/backgammon/${id}/join`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Odaya katılamadın.");
      setSession(data.session);
      latestRevision.current = data.session.revision;
      setCanJoin(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Odaya katılamadın.");
      await loadRoom(true);
    } finally {
      setBusy(false);
    }
  }

  async function act(action: BackgammonAction) {
    if (!session) return;
    roomAbortController.current?.abort();
    requestSequence.current += 1;
    setBusy(true);
    setConnectionState("syncing");
    try {
      const response = await fetch(`/api/games/backgammon/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...action, revision: session.revision }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Oyun işlemi kaydedilemedi.");
      latestUpdatedAt.current = data.session.updatedAt;
      latestRevision.current = data.session.revision;
      setSession(data.session);
      setConnectionState("connected");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Oyun işlemi kaydedilemedi.");
      setConnectionState("reconnecting");
      await loadRoom(true);
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function closeWaitingRoom() {
    setBusy(true);
    try {
      const response = await fetch(`/api/games/backgammon/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Masa kapatılamadı.");
      router.push("/games");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Masa kapatılamadı.");
      setConfirmClose(false);
      setBusy(false);
    }
  }

  return (
    <>
      <Toast message={message} onClose={() => setMessage(null)} />
      <ConfirmDialog
        open={confirmResign}
        title="Oyundan çekilmek istiyor musun?"
        body="Bu işlem maçı bitirir ve rakibini kazanan olarak kaydeder. Geri alınamaz."
        confirmLabel="Oyundan çekil"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmResign(false)}
        onConfirm={() => {
          setConfirmResign(false);
          void act({ type: "resign" });
        }}
      />
      <ConfirmDialog
        open={confirmClose}
        title="Bekleyen masa kapatılsın mı?"
        body="Davet bağlantısı geçersiz hale gelir ve bu bekleme odası silinir."
        confirmLabel="Masayı kapat"
        tone="danger"
        busy={busy}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => void closeWaitingRoom()}
      />
      <GamePageShell
        title="Tavla"
        subtitle={session?.status === "waiting" ? "Rakip bekleniyor" : session?.status === "completed" ? "Oyun tamamlandı" : "Canlı masa"}
        icon={<Dices size={20} />}
        maxWidth="wide"
        actions={account ? <AccountMenu {...account} profileSlug={account.slug} onLogout={() => void logoutToHome()} /> : null}
      >

        {loading && <GameLoadingState label="Tavla masası hazırlanıyor..." className="mt-7" />}

        {!loading && !session && loadError && (
          <GameErrorState description={`${loadError} Oda kapanmış olabilir; yeniden deneyebilir veya oyun merkezine dönebilirsin.`} onRetry={() => void loadRoom()} />
        )}

        {!loading && session?.status === "waiting" && (
          <section className="backgammon-waiting-room">
            <span className="backgammon-waiting-icon"><UsersRound size={30} /></span>
            <p className="section-kicker">Bekleme odası</p>
            <h2>Masada bir koltuk boş.</h2>
            <p>{session.isParticipant ? "Davet bağlantısını rakibine gönder. Katıldığı anda renkler belirlenip oyun başlayacak." : "Bu masaya katıl ve ilk zar için yerini al."}</p>
            <div className="backgammon-seat-preview">
              <GamePlayerSlot seat={1} name={session.players[0]?.ownerName} ready />
              <i>VS</i>
              <GamePlayerSlot seat={2} fallbackName="Rakip bekleniyor" />
            </div>
            <div className="backgammon-waiting-actions">
              {session.isParticipant && <GameInviteActions onCopy={() => void copyInvite()} copied={copied} size="lg" />}
              {canJoin && <button type="button" disabled={busy} onClick={() => void joinRoom()} className="primary-action ui-button-lg"><Dices size={18} /> {busy ? "Katılınıyor..." : "Masaya katıl"}</button>}
              {requiresLogin && <button type="button" onClick={() => goToLogin(`/games/backgammon/${id}`)} className="primary-action ui-button-lg"><LogIn size={18} /> Giriş yap ve katıl</button>}
              <button type="button" onClick={() => void loadRoom()} className="secondary-action ui-button-lg"><RefreshCw size={18} /> Yenile</button>
              {session.isOwner && <button type="button" disabled={busy} onClick={() => setConfirmClose(true)} className="secondary-action ui-button-lg backgammon-resign-action"><Trash2 size={17} /> Masayı kapat</button>}
            </div>
          </section>
        )}

        {!loading && session?.status === "abandoned" && (
          <GameStatusPanel
            icon={<CircleSlash2 size={30} />}
            kicker="Masa kapandı"
            title="Bu oturum artık aktif değil."
            description="Uzun süre işlem yapılmadığı için masa güvenli biçimde kapatıldı. Yeni bir masa açarak tekrar oynayabilirsin."
            tone="warning"
            actions={<><Link href="/games/backgammon/new" className="primary-action ui-button-lg"><Plus size={18} /> Yeni masa aç</Link><Link href="/games" className="secondary-action ui-button-lg">Oyun merkezine dön</Link></>}
          />
        )}

        {!loading && session?.status !== "abandoned" && session?.game && (
          <>
            {!session.isParticipant && (
              <div className="backgammon-spectator-notice"><Eye size={17} /><span>Bu masayı izliyorsun. Hamle kontrolleri yalnız oyunculara açıktır.</span></div>
            )}
            <BackgammonBoard
              session={session}
              busy={busy}
              connectionState={connectionState}
              onAction={(action) => void act(action)}
              onRequestResign={() => setConfirmResign(true)}
            />
            <GameEventLog events={session.events} />
            {session.status === "completed" ? (
              <section className="backgammon-postgame-bar">
                <span><Trophy size={20} /></span>
                <div><small>Maç sonucu</small><strong>{session.game.winnerName ?? "Kazanan"} masadan galip ayrıldı.</strong></div>
                <div className="backgammon-postgame-actions">
                  <Link href="/games/backgammon/new" className="primary-action ui-button-md"><Plus size={16} /> Yeni masa</Link>
                  <Link href="/games" className="secondary-action ui-button-md">Oyun merkezine dön <ArrowRight size={15} /></Link>
                </div>
              </section>
            ) : (
              <div className="backgammon-room-footer">
                <span><Share2 size={16} /> {session.visibility === "public" ? "Herkese açık masa" : "Bağlantıya özel masa"}</span>
                <button type="button" onClick={() => void copyInvite()} className="secondary-action ui-button-sm"><Copy size={15} /> {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}</button>
              </div>
            )}
          </>
        )}
      </GamePageShell>
    </>
  );
}
