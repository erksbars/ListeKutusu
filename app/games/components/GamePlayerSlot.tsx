import { CheckCircle2, Hourglass, UserRound } from "lucide-react";

type GamePlayerSlotProps = {
  seat: number;
  name?: string | null;
  fallbackName?: string;
  ready?: boolean;
  label?: string;
  className?: string;
};

export function GamePlayerSlot({
  seat,
  name,
  fallbackName = "Oyuncu bekleniyor",
  ready = false,
  label,
  className = "",
}: GamePlayerSlotProps) {
  const isPresent = Boolean(name);
  const stateLabel = ready ? "Hazır" : isPresent ? "Katıldı" : "Bekleniyor";

  return (
    <article
      className={`game-player-slot${isPresent ? " is-present" : ""}${ready ? " is-ready" : ""}${className ? ` ${className}` : ""}`}
      aria-label={`${seat}. oyuncu: ${name || fallbackName}. ${stateLabel}.`}
    >
      <span className="game-player-slot-avatar" aria-hidden="true">
        <UserRound size={17} />
      </span>
      <div>
        <small>{label || `${seat}. oyuncu`}</small>
        <strong>{name || fallbackName}</strong>
      </div>
      <span className="game-player-slot-state" title={stateLabel} aria-hidden="true">
        {ready ? <CheckCircle2 size={17} /> : <Hourglass size={17} />}
      </span>
    </article>
  );
}
