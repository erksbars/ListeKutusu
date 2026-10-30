"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Users } from "lucide-react";
import { ACCOUNT_SESSION_CHANGED, clearAccountSessionCache, loadAccountSession, type AccountSessionSummary } from "@/lib/clientAccountSession";
import { accountLoginPath } from "@/lib/navigation";
import { GlobalSearch } from "./GlobalSearch";
import { AccountMenu } from "./AccountMenu";
import { Toast } from "./Toast";
import { useDraftNavigationRequest } from "./DraftNavigationProvider";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  const pathname = usePathname(), params = useSearchParams(), router = useRouter();
  const [account, setAccount] = useState<AccountSessionSummary | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const [logoutBusy, setLogoutBusy] = useState(false), [message, setMessage] = useState<string | null>(null);
  const pending = useRef(false), requestExit = useDraftNavigationRequest();
  useEffect(() => {
    let active = true;
    const read = () => { void loadAccountSession().then(value => { if (active) { setAccount(value); setFailed(false); } }).catch(() => { if (active) setFailed(true); }); };
    const changed = (event: Event) => { if (active) { setAccount((event as CustomEvent<AccountSessionSummary | null>).detail); setFailed(false); } };
    window.addEventListener(ACCOUNT_SESSION_CHANGED, changed); window.addEventListener("focus", read); read();
    return () => { active = false; window.removeEventListener(ACCOUNT_SESSION_CHANGED, changed); window.removeEventListener("focus", read); };
  }, [pathname, retry]);
  async function logout() {
    if (pending.current) return;
    pending.current = true; setLogoutBusy(true);
    try {
      const response = await fetch("/api/accounts/logout", { method: "POST" });
      if (!response.ok) throw new Error("Çıkış yapılamadı. Yeniden deneyebilirsin.");
      clearAccountSessionCache(); router.replace("/"); router.refresh(); pending.current = false; setLogoutBusy(false);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Çıkış yapılamadı."); pending.current = false; setLogoutBusy(false); }
  }
  const loginHref = accountLoginPath(`${pathname}${params.size ? `?${params}` : ""}`);
  return <>
    <header className={styles.header} aria-label="Uygulama üst alanı">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>ListeKutusu</Link>
        <GlobalSearch />
        <Link href="/communities/create" className={styles.create}><Users size={17} aria-hidden="true" />Topluluk oluştur</Link>
        {failed && <button type="button" className="topbar-icon-button" aria-label="Hesap bilgisini yeniden yükle" onClick={() => setRetry(value => value + 1)}><RefreshCw size={18} aria-hidden="true" /></button>}
        <AccountMenu inHeader authenticated={Boolean(account)} ownerName={account?.ownerName ?? "Profil"} email={account?.email} profileSlug={account?.slug} role={account?.role} loginHref={loginHref} logoutBusy={logoutBusy} onLogout={() => requestExit(() => void logout())} />
      </div>
    </header>
    <Toast message={message} tone="error" onClose={() => setMessage(null)} />
  </>;
}
