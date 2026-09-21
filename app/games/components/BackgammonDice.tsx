"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({
  value,
  rolling = false,
  compact = false,
  used = false,
  index,
}: {
  value: number;
  rolling?: boolean;
  compact?: boolean;
  used?: boolean;
  index: number;
}) {
  const pips = new Set(PIPS[value] ?? []);
  return (
    <span
      className={`backgammon-die ${rolling ? "is-rolling" : ""} ${compact ? "is-compact" : ""} ${used ? "is-used" : ""}`}
      style={{ "--die-index": index } as React.CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, pip) => <i key={pip} className={pips.has(pip) ? "is-visible" : ""} />)}
    </span>
  );
}

export function BackgammonDice({ dice, remainingDice }: { dice: number[]; remainingDice: number[] }) {
  const visibleDice = useMemo(() => dice.slice(0, 2), [dice]);
  const useDice = useMemo(() => dice.length > 2 ? dice : visibleDice, [dice, visibleDice]);
  const signature = visibleDice.join("-");
  const previousSignature = useRef("");
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!signature) {
      previousSignature.current = "";
      return;
    }
    if (signature === previousSignature.current) return;
    previousSignature.current = signature;
    setRolling(true);
    const timer = window.setTimeout(() => setRolling(false), 380);
    return () => window.clearTimeout(timer);
  }, [signature]);

  if (!visibleDice.length) return <div className="backgammon-dice-arena is-empty" aria-label="Zarlar henüz atılmadı" />;

  return (
    <div
      className={`backgammon-dice-arena ${rolling ? "is-rolling" : "is-settled"}`}
      role="img"
      aria-label={`Zarlar ${visibleDice.join(" ve ")} geldi. ${remainingDice.length} hamle hakkı kaldı.`}
    >
      <div className="backgammon-dice-pair">
        {visibleDice.map((die, index) => <Die key={`${signature}-${index}`} value={die} rolling={rolling} index={index} />)}
      </div>
      <div className="backgammon-dice-uses" aria-hidden="true">
        {useDice.map((die, index) => {
          const occurrence = useDice.slice(0, index + 1).filter((value) => value === die).length;
          const total = useDice.filter((value) => value === die).length;
          const remaining = remainingDice.filter((value) => value === die).length;
          return <Die key={`${die}-use-${index}`} value={die} compact used={occurrence <= total - remaining} index={index} />;
        })}
      </div>
    </div>
  );
}
