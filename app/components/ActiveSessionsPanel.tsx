"use client";

import { Laptop, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SessionItem = {
  id: string;
  persistent: boolean;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
};

const sessionDate = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/accounts/sessions");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Oturumlar yüklenemedi.");
      setSessions(data.sessions || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Oturumlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  async function revoke(id?: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/accounts/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { allOthers: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Oturum kapatılamadı.");
      await loadSessions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Oturum kapatılamadı.");
    } finally {
      setBusy(false);
    }
  }

  const otherCount = sessions.filter((session) => !session.current).length;

  return (
    <section className="account-content-panel lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-kicker flex items-center gap-2"><ShieldCheck size={16} /> Açık oturumlar</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Hesabının açık olduğu oturumları incele ve tanımadığın erişimleri kapat.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadSessions()} disabled={loading || busy} className="secondary-action inline-flex h-10 w-10 items-center justify-center rounded-xl" aria-label="Oturumları yenile" title="Yenile"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
          {otherCount > 0 && <button type="button" onClick={() => void revoke()} disabled={busy} className="secondary-action inline-flex h-10 items-center rounded-xl px-4 text-xs font-black"><LogOut size={15} /> Diğerlerini kapat</button>}
        </div>
      </div>

      {error && <p className="account-inline-error mt-4">{error}</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="active-session-row">
            <span className={session.current ? "active-session-icon active-session-icon-current" : "active-session-icon"}><Laptop size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-black text-navy">{session.current ? "Bu cihaz" : "Diğer oturum"}</span><span className="mt-0.5 block truncate text-xs text-slate-500">Son etkinlik: {sessionDate.format(new Date(session.lastSeenAt))} · {session.persistent ? "Hatırlanıyor" : "12 saatlik"}</span></span>
            {!session.current && <button type="button" onClick={() => void revoke(session.id)} disabled={busy} className="secondary-action inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" aria-label="Oturumu kapat" title="Oturumu kapat"><LogOut size={14} /></button>}
          </div>
        ))}
      </div>
    </section>
  );
}
