import Link from "next/link";
import type { ReactNode } from "react";
import { Bookmark, CalendarDays, CircleHelp, Settings2 } from "lucide-react";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { DraftNavigationProvider } from "./DraftNavigationProvider";

export function AppShell({ children }: { children: ReactNode }) {
  return <DraftNavigationProvider><div className="desktop-shell">
    <aside className="desktop-shell-sidebar" aria-label="Uygulama menüsü" data-testid="app-shell-navigation">
      <Link href="/" className="desktop-shell-brand">ListeKutusu</Link>
      <PrimaryNavigation />
      <nav className="desktop-shell-personal" aria-label="Kişisel alan">
        <p>Kişisel alan</p>
        <Link href="/?scope=saved"><Bookmark size={18} aria-hidden="true" />Müzik kayıtlarım</Link>
        <Link href="/community-saved"><Bookmark size={18} aria-hidden="true" />Topluluk kayıtlarım</Link>
        <Link href="/community-events"><CalendarDays size={18} aria-hidden="true" />Etkinliklerim</Link>
        <Link href="/account"><Settings2 size={18} aria-hidden="true" />Hesap ve profil</Link>
      </nav>
      <Link href="/legal" className="desktop-shell-help"><CircleHelp size={18} aria-hidden="true" />Kullanım ve gizlilik</Link>
    </aside>
    <div className="desktop-shell-content">{children}</div>
  </div></DraftNavigationProvider>;
}
