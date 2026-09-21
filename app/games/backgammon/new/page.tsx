"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Dices, Globe2, Link2, LogIn, ShieldCheck, UsersRound } from "lucide-react";
import { AccountMenu } from "@/app/components/AccountMenu";
import { Toast } from "@/app/components/Toast";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { BackgammonMiniBoard } from "../../components/BackgammonMiniBoard";
import { GamePageShell } from "../../components/GamePageShell";
import { GameErrorState } from "../../components/GameErrorState";
import type { GameAccount } from "../../gameTypes";

export default function NewBackgammonPage() {
  const router = useRouter();
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { goToLogin, logoutToHome } = useSessionNavigation();

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/games");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Hesap bilgisi alınamadı.");
      setAccount(data.account ?? null);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Hesap bilgisi alınamadı.";
      setLoadError(detail);
      setMessage(detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAccount(); }, [loadAccount]);

  async function createRoom() {
    if (!account) return goToLogin("/games/backgammon/new");
    setCreating(true);
    try {
      const response = await fetch("/api/games/backgammon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Tavla odası açılamadı.");
      router.push(`/games/backgammon/${data.sessionId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tavla odası açılamadı.");
      setCreating(false);
    }
  }

  return (
    <>
      <Toast message={message} onClose={() => setMessage(null)} />
      <GamePageShell
        title="Tavla masası kur"
        subtitle="Rakibini davet et, zarları sunucu atsın ve klasik kurallarla oyna."
        icon={<Dices size={20} />}
        maxWidth="wide"
        actions={account ? <AccountMenu {...account} profileSlug={account.slug} onLogout={() => void logoutToHome()} /> : null}
      >

        {!loading && loadError ? (
          <GameErrorState title="Masa kurulumu açılamadı" description={loadError} onRetry={() => void loadAccount()} />
        ) : <section className="backgammon-setup-layout">
          <article className="backgammon-setup-card">
            <p className="section-kicker">Yeni oyun</p>
            <h2>Masayı nasıl açalım?</h2>
            <p>Görünürlüğü seç; ikinci oyuncu geldiğinde renkler ve ilk sıra otomatik belirlensin.</p>

            <div className="backgammon-setup-meta" aria-label="Oyun bilgileri">
              <span><UsersRound size={15} /> 2 oyuncu</span>
              <span><Clock3 size={15} /> 10-25 dakika</span>
              <span><ShieldCheck size={15} /> Türk tavlası</span>
            </div>

            <div className="backgammon-visibility-options" role="radiogroup" aria-label="Oda görünürlüğü">
              <button type="button" role="radio" aria-checked={visibility === "public"} onClick={() => setVisibility("public")}>
                <Globe2 size={20} /><span><strong>Herkese açık masa</strong><small>Aktif odalarda görünür; isteyen katılabilir.</small></span>
              </button>
              <button type="button" role="radio" aria-checked={visibility === "unlisted"} onClick={() => setVisibility("unlisted")}>
                <Link2 size={20} /><span><strong>Davet bağlantısıyla</strong><small>Yalnız bağlantıyı paylaştığın kişi katılır.</small></span>
              </button>
            </div>

            {loading ? (
              <div className="backgammon-setup-state" role="status">Hesap kontrol ediliyor...</div>
            ) : account ? (
              <button type="button" onClick={() => void createRoom()} disabled={creating} className="primary-action ui-button-lg w-full">
                <Dices size={19} /> {creating ? "Masa hazırlanıyor..." : "Masayı aç"}
              </button>
            ) : (
              <button type="button" onClick={() => goToLogin("/games/backgammon/new")} className="primary-action ui-button-lg w-full">
                <LogIn size={19} /> Giriş yap ve masa aç
              </button>
            )}
          </article>

          <aside className="backgammon-rules-card">
            <div className="backgammon-preview-heading">
              <div><p className="section-kicker">Masa önizlemesi</p><h2>Bir rakip kaldı.</h2></div>
              <span className="backgammon-preview-visibility">{visibility === "public" ? <Globe2 size={14} /> : <Link2 size={14} />}{visibility === "public" ? "Açık" : "Özel"}</span>
            </div>
            <BackgammonMiniBoard />
            <div className="backgammon-preview-seats">
              <span className="is-ready"><Check size={15} /><span><small>Masa sahibi</small><strong>{account?.ownerName ?? "Sen"}</strong></span></span>
              <i>VS</i>
              <span><UsersRound size={15} /><span><small>İkinci koltuk</small><strong>Rakip bekleniyor</strong></span></span>
            </div>
            <ul className="backgammon-table-assurances">
              <li><Dices size={16} /><span><strong>Sunucu zarı</strong><small>Her tur sunucuda üretilir.</small></span></li>
              <li><ShieldCheck size={16} /><span><strong>Geçerli hamleler</strong><small>Kurallar masada denetlenir.</small></span></li>
            </ul>
          </aside>
        </section>}
      </GamePageShell>
    </>
  );
}
