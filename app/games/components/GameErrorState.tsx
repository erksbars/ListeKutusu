import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";
import { GameStatusPanel } from "./GameStatusPanel";

type GameErrorStateProps = {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
};

export function GameErrorState({
  title = "Oyun alanı yüklenemedi",
  description,
  retryLabel = "Yeniden dene",
  onRetry,
  backHref = "/games",
  backLabel = "Oyun merkezine dön",
}: GameErrorStateProps) {
  return (
    <GameStatusPanel
      icon={<CircleAlert size={28} />}
      kicker="Bağlantı sorunu"
      title={title}
      description={description}
      tone="error"
      actions={(
        <>
          {onRetry ? (
            <button type="button" className="primary-action ui-button-md" onClick={onRetry}>
              <RefreshCw size={16} /> {retryLabel}
            </button>
          ) : null}
          <Link href={backHref} className="secondary-action ui-button-md">{backLabel}</Link>
        </>
      )}
    />
  );
}
