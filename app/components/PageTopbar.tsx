import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { PrimaryNavigation } from "./PrimaryNavigation";

type PageTopbarProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
  titleAs?: "h1" | "div";
  showPrimaryNavigation?: boolean;
};

export function PageTopbar({
  title,
  subtitle,
  icon,
  backHref = "/",
  backLabel = backHref === "/" ? "Ana akışa dön" : "Geri",
  onBack,
  actions,
  className = "",
  titleAs = "h1",
  showPrimaryNavigation = false,
}: PageTopbarProps) {
  const Title = titleAs;

  return (
    <header className={`app-topbar page-topbar sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 py-3 ${showPrimaryNavigation ? "page-topbar-with-navigation" : ""} ${className}`}>
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
          <Title className="page-topbar-title text-lg font-bold text-white">{title}</Title>
          <p className="page-topbar-subtitle text-xs font-medium text-cyan-50/72">{subtitle}</p>
        </div>
      </div>
      {showPrimaryNavigation && <PrimaryNavigation />}
      <div className="page-topbar-actions">
        {actions}
      </div>
    </header>
  );
}
