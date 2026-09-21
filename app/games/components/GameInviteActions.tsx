import { Copy, RefreshCw } from "lucide-react";

type GameInviteActionsProps = {
  onCopy: () => void;
  onRefresh?: () => void;
  copied?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  refreshLabel?: string;
  size?: "sm" | "md" | "lg";
  primaryCopy?: boolean;
  className?: string;
};

export function GameInviteActions({
  onCopy,
  onRefresh,
  copied = false,
  copyLabel = "Davet bağlantısını kopyala",
  copiedLabel = "Bağlantı kopyalandı",
  refreshLabel = "Durumu yenile",
  size = "md",
  primaryCopy = true,
  className = "",
}: GameInviteActionsProps) {
  const buttonSize = `ui-button-${size}`;

  return (
    <div className={`game-invite-actions${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        onClick={onCopy}
        className={`${primaryCopy ? "primary-action" : "secondary-action"} ${buttonSize}`}
      >
        <Copy size={size === "lg" ? 18 : 16} />
        {copied ? copiedLabel : copyLabel}
      </button>
      {onRefresh && (
        <button type="button" onClick={onRefresh} className={`secondary-action ${buttonSize}`}>
          <RefreshCw size={size === "lg" ? 18 : 16} />
          {refreshLabel}
        </button>
      )}
    </div>
  );
}
