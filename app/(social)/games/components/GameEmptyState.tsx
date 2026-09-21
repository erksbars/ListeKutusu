import type { ReactNode } from "react";

export function GameEmptyState({ icon, title, description, className = "" }: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`games-empty-state ${className}`}>
      {icon}
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
