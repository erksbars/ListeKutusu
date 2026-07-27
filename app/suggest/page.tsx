"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock3,
  KeyRound,
  ListMusic,
  Music2,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { Toast } from "@/app/components/Toast";
import { MobileDock } from "@/app/components/MobileDock";
import { AccountMenu } from "@/app/components/AccountMenu";
import { PageTopbar } from "@/app/components/PageTopbar";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";

type Account = {
  id: string;
  ownerName: string;
  email?: string | null;
  slug?: string | null;
  role?: string | null;
};

type TargetList = {
  id: string;
  ownerName: string;
  playlistName: string | null;
  slug: string;
  spotifyExternalUrl: string | null;
};

type TrackResult = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  externalUrl: string | null;
  durationMs: number;
};

type HistoryItem = {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  status: string;
  createdAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function statusLabel(status: string) {
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  if (status === "removed") return "Çıkarıldı";
  return "Bekliyor";
}

export default function SuggestPage() {
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [account, setAccount] = useState<Account | null>(null);
  const [code, setCode] = useState("");
  const [target, setTarget] = useState<TargetList | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  const [selected, setSelected] = useState<TrackResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [checking, setChecking] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);

  const loadHistory = useCallback(async (listId: string) => {
    const response = await fetch(`/api/suggest/history?listId=${encodeURIComponent(listId)}`);
    const data = await response.json().catch(() => null);
    if (response.ok) setHistory(data?.suggestions || []);
  }, []);

  const resolveCode = useCallback(async (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!/^EKLE-[A-F0-9]{8}$/.test(normalized)) {
      setMessage("Kod EKLE-XXXXXXXX biçiminde olmalı.");
      return;
    }
    setResolving(true);
    setMessage(null);
    const response = await fetch(`/api/accounts/resolve?code=${encodeURIComponent(normalized)}`);
    const data = await response.json().catch(() => null);
    setResolving(false);
    if (response.status === 401) {
      goToLogin(`/suggest?code=${normalized}`);
      return;
    }
    if (!response.ok || !data?.list) {
      setTarget(null);
      setMessage(data?.error || "Bu koda ait liste bulunamadı.");
      return;
    }
    setCode(normalized);
    setTarget(data.list);
    setSelected([]);
    setQuery("");
    setResults([]);
    window.history.replaceState(null, "", `/suggest?code=${encodeURIComponent(normalized)}`);
    await loadHistory(data.list.id);
  }, [goToLogin, loadHistory]);

  useEffect(() => {
    const initialCode = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase() || "";
    setCode(initialCode);
    fetch("/api/accounts/me")
      .then(async (response) => {
        if (response.status === 401) {
          const next = initialCode ? `/suggest?code=${encodeURIComponent(initialCode)}` : "/suggest";
          goToLogin(next);
          return;
        }
        const data = await response.json();
        setAccount(data.list);
        setChecking(false);
        if (initialCode) await resolveCode(initialCode);
      })
      .catch(() => {
        setChecking(false);
        setMessage("Hesap bilgisi alınamadı.");
      });
  }, [goToLogin, resolveCode]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!target || query.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json().catch(() => null);
      setSearching(false);
      if (!response.ok) {
        setMessage(data?.error || "Şarkı araması tamamlanamadı.");
        return;
      }
      setResults(data?.results || []);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, target]);

  function submitCode(event: FormEvent) {
    event.preventDefault();
    void resolveCode(code);
  }

  function toggleTrack(track: TrackResult) {
    setSelected((current) =>
      current.some((item) => item.id === track.id)
        ? current.filter((item) => item.id !== track.id)
        : [...current, track]
    );
  }

  async function logoutAccount() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  async function sendSelected() {
    if (!target || selected.length === 0) return;
    setSending(true);
    setMessage(null);
    let sent = 0;
    const failed: string[] = [];
    for (const track of selected) {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, code }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok) sent += 1;
      else failed.push(`${track.name}: ${data?.error || "Gönderilemedi"}`);
    }
    setSending(false);
    if (sent) {
      setSelected((current) => current.filter((item) => failed.some((failure) => failure.startsWith(`${item.name}:`))));
      await loadHistory(target.id);
    }
    setMessage(
      failed.length
        ? `${sent} öneri gönderildi, ${failed.length} öneri gönderilemedi. ${failed.join(" | ")}`
        : `${sent} şarkı liste sahibinin onayına gönderildi.`
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-24 text-white sm:px-6">
      <Toast message={message} onClose={() => setMessage(null)} />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Listeye şarkı öner"
          subtitle="Davet koduyla doğru listeye toplu öneri gönder"
          icon={<Music2 size={19} />}
          backLabel="Ana akışa dön"
          className="suggest-topbar"
          actions={account && (
            <AccountMenu
              ownerName={account.ownerName}
              email={account.email}
              profileSlug={account.slug}
              role={account.role}
              onLogout={() => void logoutAccount()}
            />
          )}
        />

        {checking ? (
          <div className="mt-8 text-sm text-cyan-50/75">Hesap kontrol ediliyor...</div>
        ) : (
          <>
          <ol className="suggest-progress mt-5" aria-label="Öneri gönderme adımları">
            <li data-state={target ? "done" : "active"}>
              <span>{target ? <Check size={14} /> : "1"}</span>
              <strong>Liste</strong>
            </li>
            <li data-state={selected.length > 0 ? "done" : target ? "active" : "idle"}>
              <span>{selected.length > 0 ? <Check size={14} /> : "2"}</span>
              <strong>Şarkılar</strong>
            </li>
            <li data-state={selected.length > 0 ? "active" : "idle"}>
              <span>3</span>
              <strong>Gönder</strong>
            </li>
          </ol>
          <div className="suggest-layout mt-4">
            <div className="min-w-0">
              <section className="surface-raised rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="suggest-step-icon"><KeyRound size={18} /></span>
                  <div>
                    <p className="section-kicker">1. Listeyi bul</p>
                    <h2 className="mt-1 text-xl font-bold text-navy">Davet kodunu gir</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Liste sahibinin paylaştığı `EKLE-XXXXXXXX` kodunu kullan.</p>
                  </div>
                </div>
                <form onSubmit={submitCode} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="suggest-code" className="sr-only">Liste davet kodu</label>
                  <input
                    id="suggest-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 13))}
                    placeholder="EKLE-XXXXXXXX"
                    className="app-input h-11 min-w-0 flex-1 rounded-xl px-4 text-sm font-bold uppercase"
                  />
                  <button type="submit" disabled={resolving} className="primary-action h-11 rounded-xl px-5 text-sm font-bold disabled:opacity-60">
                    {resolving ? "Kontrol ediliyor..." : "Listeyi bul"}
                  </button>
                </form>
                {target && (
                  <div className="suggest-target mt-4">
                    <span><ListMusic size={18} /></span>
                    <div className="min-w-0">
                      <strong>{target.playlistName || target.ownerName}</strong>
                      <small>{target.ownerName} tarafından yönetiliyor</small>
                    </div>
                    <Check size={18} className="ml-auto text-emerald-600" />
                  </div>
                )}
              </section>

              <section className={`surface-raised mt-4 rounded-2xl p-5 ${!target ? "opacity-55" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="suggest-step-icon"><Search size={18} /></span>
                  <div>
                    <p className="section-kicker">2. Şarkıları seç</p>
                    <h2 className="mt-1 text-xl font-bold text-navy">Arama ve toplu seçim</h2>
                  </div>
                </div>
                <label htmlFor="suggest-search" className="sr-only">Şarkı veya sanatçı ara</label>
                <input
                  id="suggest-search"
                  type="search"
                  disabled={!target}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={target ? "Şarkı veya sanatçı ara..." : "Önce davet kodunu doğrula"}
                  className="app-input mt-4 h-12 w-full rounded-xl px-4 text-sm"
                />
                <div className="mt-3 grid gap-2">
                  {searching && <p className="py-4 text-sm text-slate-500">Aranıyor...</p>}
                  {!searching && query.trim().length >= 2 && results.length === 0 && <p className="py-4 text-sm text-slate-500">Sonuç bulunamadı.</p>}
                  {results.slice(0, 10).map((track) => (
                    <button key={track.id} type="button" onClick={() => toggleTrack(track)} className={`suggest-result ${selectedIds.has(track.id) ? "suggest-result-selected" : ""}`}>
                      <span className="suggest-result-check">{selectedIds.has(track.id) && <Check size={15} />}</span>
                      <span className="min-w-0 flex-1 text-left">
                        <strong>{track.name}</strong>
                        <small>{track.artist} · {track.album}</small>
                      </span>
                      <span>{selectedIds.has(track.id) ? "Seçildi" : "Seç"}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="suggest-rail">
              <section className="surface-dark rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-100/75">Seçilenler</p>
                    <h2 className="mt-1 text-lg font-bold text-white">{selected.length} şarkı</h2>
                  </div>
                  {selected.length > 0 && <button type="button" onClick={() => setSelected([])} className="text-xs font-bold text-cyan-100/75 hover:text-white">Temizle</button>}
                </div>
                <div className="mt-4 grid gap-2">
                  {selected.length === 0 && <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-cyan-50/75">Arama sonuçlarındaki şarkıları seçtiğinde burada birikir.</p>}
                  {selected.map((track) => (
                    <div key={track.id} className="suggest-selected-row">
                      <span className="min-w-0 flex-1"><strong>{track.name}</strong><small>{track.artist}</small></span>
                      <button type="button" onClick={() => toggleTrack(track)} aria-label={`${track.name} seçimini kaldır`} title="Seçimi kaldır"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => void sendSelected()} disabled={sending || selected.length === 0 || !target} className="primary-action mt-4 h-12 w-full rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
                  <Send size={16} />{sending ? "Gönderiliyor..." : "Önerileri gönder"}
                </button>
              </section>

              <section className="surface-dark rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} className="text-cyan-200" />
                  <h2 className="text-sm font-bold text-white">Son gönderdiklerin</h2>
                </div>
                <div className="mt-3 grid gap-2">
                  {history.slice(0, 8).map((item) => (
                    <div key={item.id} className="suggest-history-row">
                      <span className="min-w-0 flex-1"><strong>{item.trackName}</strong><small>{item.artistName} · {dateFormatter.format(new Date(item.createdAt))}</small></span>
                      <em data-status={item.status}>{statusLabel(item.status)}</em>
                    </div>
                  ))}
                  {target && history.length === 0 && <p className="text-sm leading-6 text-cyan-50/70">Bu listeye henüz öneri göndermedin.</p>}
                  {!target && <p className="text-sm leading-6 text-cyan-50/70">Geçmişi görmek için bir liste kodu doğrula.</p>}
                </div>
              </section>
            </aside>
          </div>
          {selected.length > 0 && (
            <div className="suggest-mobile-submit">
              <span><strong>{selected.length}</strong> şarkı seçildi</span>
              <button type="button" onClick={() => void sendSelected()} disabled={sending || !target}>
                <Send size={16} /> {sending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          )}
          </>
        )}
        <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} active={null} />
      </section>
    </main>
  );
}
