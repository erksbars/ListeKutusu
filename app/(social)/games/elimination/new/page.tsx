"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Globe2, ListChecks, LockKeyhole } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { Toast } from "@/app/components/Toast";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { GameTrackPicker, type GameCandidate } from "@/app/(social)/games/components/GameTrackPicker";
import { GamePageShell } from "@/app/(social)/games/components/GamePageShell";
import { GameLoadingState } from "@/app/(social)/games/components/GameLoadingState";
import { GameErrorState } from "@/app/(social)/games/components/GameErrorState";
import type { GameAccount } from "@/app/(social)/games/gameTypes";

export default function NewEliminationPage() {
  const router = useRouter();
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [candidates, setCandidates] = useState<GameCandidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [invitedSlug, setInvitedSlug] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<2 | 4>(2);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { goToLogin, logoutToHome } = useSessionNavigation();

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const response = await fetch("/api/games/elimination/candidates");
    const data = await response.json().catch(() => null);
    if (response.status === 401) {
      const returnPath = typeof window === "undefined" ? "/games/elimination/new" : `${window.location.pathname}${window.location.search}`;
      goToLogin(returnPath);
      return;
    }
    if (!response.ok) {
      const detail = data?.error || "Şarkı havuzu yüklenemedi.";
      setMessage(detail);
      setLoadError(detail);
    }
    else { setCandidates(data.candidates ?? []); setAccount(data.account ?? null); }
    setLoading(false);
  }, [goToLogin]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("opponent")?.trim() ?? "";
    if (!/^[a-z0-9-]{2,60}$/i.test(value)) return;
    setInvitedSlug(value);
    setIsPrivate(true);
  }, []);

  useEffect(() => { void loadCandidates(); }, [loadCandidates]);

  async function createGame() {
    if (selected.length !== 4 || creating) return;
    setCreating(true);
    const response = await fetch("/api/games/elimination", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackIds: selected, maxPlayers, visibility: isPrivate ? "unlisted" : "public" }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Düello başlatılamadı.");
      setCreating(false);
      return;
    }
    router.push(`/games/elimination/${data.sessionId}`);
  }

  return (
    <>
      <Toast message={message} onClose={() => setMessage(null)} />
      <GamePageShell title="Şarkı Düellosu" subtitle="Grubunla karşılaştırmak için dört parça seç." icon={<ListChecks size={20} />} actions={account ? <AccountMenu {...account} profileSlug={account.slug} onLogout={() => void logoutToHome()} /> : null}>
        {!loading && loadError ? (
          <GameErrorState title="Şarkı havuzu açılamadı" description={loadError} onRetry={() => void loadCandidates()} />
        ) : <section className="game-setup-layout">
          <div className="game-track-picker">
            <div className="game-track-picker-heading">
              <div><p className="section-kicker">Senin seçkilerin</p><h2>4 şarkı seç</h2><p>Diğer oyuncuların parçalarıyla birleşip herkesin aynı anda oylayacağı ortak turnuvayı oluşturacak.</p></div>
              <strong>{selected.length}/4</strong>
            </div>
            {loading ? <GameLoadingState label="Şarkılar yükleniyor..." className="mt-4" /> : <GameTrackPicker candidates={candidates} selected={selected} onChange={setSelected} />}
          </div>
          <aside className="game-setup-summary">
            <p className="section-kicker">Düello özeti</p>
            <h2>Aynı eşleşme, ortak karar.</h2>
            <p>Herkes dörder parça getirir. Bir eşleşme ancak bütün oyuncular oy verdiğinde sonuçlanır ve turnuva birlikte ilerler.</p>
            {invitedSlug && (
              <div className="game-target-invite">
                <Gamepad2 size={17} />
                <span><strong>@{invitedSlug}</strong> için özel oda hazırlıyorsun.</span>
              </div>
            )}
            <div className="game-player-count" role="group" aria-label="Oyuncu sayısı">
              <button type="button" aria-pressed={maxPlayers === 2} onClick={() => setMaxPlayers(2)}>2 oyuncu</button>
              <button type="button" aria-pressed={maxPlayers === 4} onClick={() => setMaxPlayers(4)}>4 oyuncu</button>
            </div>
            <div className="game-bracket-summary game-bracket-summary-three">
              <span><strong>{maxPlayers}×4</strong><small>şarkı</small></span>
              <span><strong>{maxPlayers}</strong><small>oy / eşleşme</small></span>
              <span><strong>1</strong><small>oda favorisi</small></span>
            </div>
            <label className="game-privacy-toggle">
              <input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} />
              <span aria-hidden="true" />
              {isPrivate ? <LockKeyhole size={16} /> : <Globe2 size={16} />}
              <div><strong>{isPrivate ? "Özel oda" : "Herkese açık oda"}</strong><small>{isPrivate ? "Yalnız davet bağlantısıyla bulunur." : "Aktif odalarda görünür ve izlenebilir."}</small></div>
            </label>
            <button type="button" onClick={createGame} disabled={selected.length !== 4 || creating} className="primary-action ui-button-lg w-full">
              <Gamepad2 size={17} /> {creating ? "Hazırlanıyor..." : "Düelloyu oluştur"}
            </button>
          </aside>
        </section>}
      </GamePageShell>
    </>
  );
}
