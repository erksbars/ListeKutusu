import type { ReactNode } from "react";
import { PageTopbar } from "@/app/components/PageTopbar";

type GamePageShellProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  maxWidth?: "standard" | "wide";
};

export function GamePageShell({
  title,
  subtitle,
  icon,
  children,
  actions,
  backHref = "/games",
  maxWidth = "standard",
}: GamePageShellProps) {
  return (
    <main id="main-content" tabIndex={-1} className="stage-shell game-page-shell min-h-screen bg-app text-white">
      <div className={`game-page-container is-${maxWidth}`}>
        <PageTopbar
          title={title}
          subtitle={subtitle}
          icon={icon}
          backHref={backHref}
          actions={actions}
          showPrimaryNavigation
        />
        {children}
      </div>
    </main>
  );
}
