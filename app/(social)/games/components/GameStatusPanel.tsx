import type { ReactNode } from "react";

type GameStatusPanelProps = {
  icon: ReactNode;
  kicker: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error";
};

export function GameStatusPanel({
  icon,
  kicker,
  title,
  description,
  actions,
  tone = "neutral",
}: GameStatusPanelProps) {
  return (
    <section className={`game-status-panel is-${tone}`} role="status">
      <span className="game-status-icon" aria-hidden="true">{icon}</span>
      <p className="section-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {actions ? <div className="game-status-actions">{actions}</div> : null}
    </section>
  );
}
