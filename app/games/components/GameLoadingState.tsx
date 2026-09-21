export function GameLoadingState({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`games-loading ${className}`} role="status" aria-live="polite" aria-busy="true">
      <span className="game-loading-indicator" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
