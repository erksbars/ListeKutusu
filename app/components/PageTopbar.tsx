import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type PageTopbarProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
};

export function PageTopbar({
  title,
  subtitle,
  icon,
  backHref = "/",
  backLabel = "Geri",
  onBack,
  actions,
  className = "",
}: PageTopbarProps) {
  return (
    <header className={`app-topbar page-topbar sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 py-3 ${className}`}>
      <div className="page-topbar-leading">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label={backLabel} title={backLabel} className="topbar-icon-button shrink-0">
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
        ) : (
          <Link href={backHref} aria-label={backLabel} title={backLabel} className="topbar-icon-button shrink-0">
            <ArrowLeft size={19} aria-hidden="true" />
          </Link>
        )}
        <span className="brand-mark" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white">{title}</h1>
          <p className="truncate text-xs font-medium text-cyan-50/72">{subtitle}</p>
        </div>
      </div>
      <div className="page-topbar-actions">
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}
