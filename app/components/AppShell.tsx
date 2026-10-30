import { Suspense, type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { HeaderNavigationProvider } from "./HeaderNavigationContext";
import { DraftNavigationProvider } from "./DraftNavigationProvider";
import styles from "./AppHeader.module.css";
import searchStyles from "./SocialSearch.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return <DraftNavigationProvider><HeaderNavigationProvider><div className={`desktop-shell ${styles.shell}`}>
    <div className={`desktop-shell-content ${styles.content} ${searchStyles.content}`}><Suspense fallback={<div style={{ minHeight: 72 }} aria-label="Üst alan yükleniyor" />}><AppHeader /></Suspense>{children}</div>
  </div></HeaderNavigationProvider></DraftNavigationProvider>;
}
