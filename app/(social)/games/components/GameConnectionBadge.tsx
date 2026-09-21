import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export type GameConnectionState = "connected" | "syncing" | "reconnecting";

const labels: Record<GameConnectionState, string> = {
  connected: "Bağlı",
  syncing: "Senkronize ediliyor",
  reconnecting: "Yeniden bağlanıyor",
};

export function GameConnectionBadge({ state }: { state: GameConnectionState }) {
  const Icon = state === "connected" ? Wifi : state === "syncing" ? RefreshCw : WifiOff;
  return (
    <span className={`game-connection-badge is-${state}`} role="status">
      <Icon size={15} aria-hidden="true" />
      {labels[state]}
    </span>
  );
}
