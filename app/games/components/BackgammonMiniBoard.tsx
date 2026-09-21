type BackgammonMiniBoardProps = {
  compact?: boolean;
};

function PointRow({ side }: { side: "top" | "bottom" }) {
  return (
    <span className={`backgammon-mini-points is-${side}`}>
      {Array.from({ length: 6 }, (_, index) => <i key={`left-${index}`} data-tone={index % 2 === 0 ? "steel" : "cyan"} />)}
      <b aria-hidden="true" />
      {Array.from({ length: 6 }, (_, index) => <i key={`right-${index}`} data-tone={index % 2 === 0 ? "cyan" : "steel"} />)}
    </span>
  );
}

function CheckerStack({ className, color, count }: { className: string; color: "dark" | "light"; count: number }) {
  return (
    <span className={`backgammon-mini-stack ${className}`} data-color={color}>
      {Array.from({ length: count }, (_, index) => <i key={index} />)}
    </span>
  );
}

export function BackgammonMiniBoard({ compact = false }: BackgammonMiniBoardProps) {
  return (
    <div className={`backgammon-mini-board ${compact ? "is-compact" : ""}`} aria-hidden="true">
      <PointRow side="top" />
      <PointRow side="bottom" />
      <CheckerStack className="is-top-start" color="dark" count={3} />
      <CheckerStack className="is-top-middle" color="light" count={3} />
      <CheckerStack className="is-bottom-middle" color="dark" count={3} />
      <CheckerStack className="is-bottom-end" color="light" count={3} />
      <span className="backgammon-mini-dice"><i>3</i><i>5</i></span>
    </div>
  );
}
