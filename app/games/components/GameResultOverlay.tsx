import { Trophy } from "lucide-react";

export function GameResultOverlay({ winner, detail }: { winner: string; detail: string }) {
  return (
    <div className="game-result-overlay" role="status" aria-live="polite">
      <span aria-hidden="true"><Trophy size={24} /></span>
      <small>Maç tamamlandı</small>
      <strong>{winner}</strong>
      <p>{detail}</p>
    </div>
  );
}
