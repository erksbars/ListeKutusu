"use client";

import Link from "next/link";
import { RefreshCw, ShieldBan, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type BlockedUser = {
  id: string;
  ownerName: string;
  slug: string;
  bio: string | null;
  profileTheme: string;
  blockedAt: string;
};

export function BlockedAccountsPanel() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profiles/block");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Engellenen hesaplar yüklenemedi.");
      setUsers(data.users || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Engellenen hesaplar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function unblock(user: BlockedUser) {
    if (busyId) return;
    setBusyId(user.id);
    setError(null);
    try {
      const response = await fetch("/api/profiles/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: user.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.blocked !== false) throw new Error(data.error || "Engel kaldırılamadı.");
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Engel kaldırılamadı.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="account-content-panel lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-kicker flex items-center gap-2"><ShieldBan size={16} /> Engellenen hesaplar</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Engellediğin hesaplar seni takip edemez ve karşılıklı içerikleriniz akışlarda gösterilmez.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} disabled={loading} className="secondary-action inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" aria-label="Engellenen hesapları yenile" title="Yenile"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
      </div>

      {error && <p className="account-inline-error mt-4">{error}</p>}
      {!loading && users.length === 0 && !error && <p className="account-inline-empty mt-4">Engellediğin bir hesap yok.</p>}
      {users.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {users.map((user) => (
            <div key={user.id} className="blocked-account-row">
              <Link href={`/u/${user.slug}`} className="nav-avatar h-10 w-10 shrink-0" aria-label={`${user.ownerName} profilini aç`}>{user.ownerName.slice(0, 1).toUpperCase()}</Link>
              <Link href={`/u/${user.slug}`} className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-navy">{user.ownerName}</span><span className="mt-0.5 block truncate text-xs text-slate-500">@{user.slug}</span></Link>
              <button type="button" onClick={() => void unblock(user)} disabled={Boolean(busyId)} className="secondary-action inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-xs font-black"><Unlock size={14} /><span className="hidden sm:inline">Engeli kaldır</span></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
