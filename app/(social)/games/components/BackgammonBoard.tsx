"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CircleSlash2, Dices, Flag, Maximize2, Minimize2, PackageCheck, Undo2 } from "lucide-react";
import { BackgammonDice } from "@/app/(social)/games/components/BackgammonDice";
import { GameConnectionBadge, type GameConnectionState } from "@/app/(social)/games/components/GameConnectionBadge";
import { GameResultOverlay } from "@/app/(social)/games/components/GameResultOverlay";
import type { BackgammonCheckerStack, BackgammonSession } from "@/app/(social)/games/gameTypes";

type GameAction =
  | { type: "roll" }
  | { type: "point"; point: number | "bar" | "off_board" }
  | { type: "move"; from: number | "bar"; to: number | "off_board" }
  | { type: "cancel" }
  | { type: "pass" };

function CheckerPile({
  stack,
  compact = false,
  changed = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  stack: BackgammonCheckerStack;
  compact?: boolean;
  changed?: boolean;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLElement>;
  onDragEnd?: React.DragEventHandler<HTMLElement>;
}) {
  const visible = Math.min(stack.count, compact ? 4 : 5);
  return (
    <span className={`backgammon-checker-pile ${compact ? "is-compact" : ""} ${changed ? "is-changing" : ""}`}>
      {Array.from({ length: visible }, (_, index) => (
        <i
          key={index}
          className="backgammon-checker"
          data-color={stack.color ?? undefined}
          draggable={draggable && index === visible - 1}
          onDragStart={draggable && index === visible - 1 ? onDragStart : undefined}
          onDragEnd={draggable && index === visible - 1 ? onDragEnd : undefined}
        ><span /></i>
      ))}
      {stack.count > visible && <b>{stack.count}</b>}
    </span>
  );
}

function Point({
  point,
  index,
  side,
  direction,
  disabled,
  targetMode,
  viewerColor,
  changed,
  lastMove,
  invalidDrop,
  dragSource,
  dragTarget,
  onDragSourceChange,
  onMove,
  onSelect,
}: {
  point: NonNullable<BackgammonSession["game"]>["points"][number];
  index: number;
  side: "top" | "bottom";
  direction: "clockwise" | "counterclockwise";
  disabled: boolean;
  targetMode: boolean;
  viewerColor: "black" | "white" | null;
  changed: boolean;
  lastMove: boolean;
  invalidDrop: boolean;
  dragSource: boolean;
  dragTarget: boolean;
  onDragSourceChange: (point: number | "bar" | null) => void;
  onMove: (from: number | "bar", to: number | "off_board") => void;
  onSelect: (point: number | "bar" | "off_board") => void;
}) {
  const pointNumber = point.position[direction];
  const isTarget = targetMode && point.movable;
  const isHitTarget = isTarget && point.count === 1 && point.color !== null && point.color !== viewerColor;
  const isEmptyTarget = isTarget && point.count === 0;
  const stateClass = point.selected
    ? "is-selected"
    : isHitTarget
      ? "is-hit-target"
      : isEmptyTarget
        ? "is-empty-target"
        : isTarget
          ? "is-stack-target"
          : point.movable
            ? "is-source"
            : targetMode
              ? "is-blocked"
              : "";

  return (
    <button
      type="button"
      className={`backgammon-point is-${side} ${stateClass} ${lastMove ? "is-last-move" : ""} ${invalidDrop ? "is-invalid-drop" : ""} ${dragSource ? "is-drag-source" : ""} ${dragTarget ? "is-drag-target" : ""}`}
      data-point-id={point.id}
      data-tone={index % 2 === 0 ? "steel" : "cyan"}
      disabled={disabled || point.actionPoint === null}
      aria-pressed={point.selected}
      onClick={() => point.actionPoint !== null && onSelect(point.actionPoint)}
      onDragOver={(event) => {
        if (!dragTarget) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!dragTarget) return;
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/x-backgammon-point");
        const from = raw === "bar" ? "bar" : Number(raw);
        if (from === "bar" || Number.isInteger(from)) onMove(from, Number(point.id));
        onDragSourceChange(null);
      }}
      aria-label={`${pointNumber}. hane, ${point.count} taş${point.selected ? ", seçili" : point.movable ? isHitTarget ? ", vurma hedefi" : ", oynanabilir" : ""}`}
    >
      {isEmptyTarget && <span className="backgammon-target-ghost" aria-hidden="true" />}
      {isHitTarget && <span className="backgammon-hit-mark" aria-hidden="true">×</span>}
      <CheckerPile
        stack={point}
        changed={changed}
        draggable={!disabled && dragSource}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-backgammon-point", point.id);
          onDragSourceChange(Number(point.id));
        }}
        onDragEnd={() => onDragSourceChange(null)}
      />
    </button>
  );
}

function BarSlot({ stack, label, disabled, dragSource, lastMove, invalidDrop, onDragSourceChange, onSelect }: {
  stack: BackgammonCheckerStack;
  label: string;
  disabled: boolean;
  dragSource: boolean;
  lastMove: boolean;
  invalidDrop: boolean;
  onDragSourceChange: (point: number | "bar" | null) => void;
  onSelect: (point: number | "bar" | "off_board") => void;
}) {
  return (
    <button
      type="button"
      className={`backgammon-bar-slot ${stack.movable ? "is-source" : ""} ${lastMove ? "is-last-move" : ""} ${invalidDrop ? "is-invalid-drop" : ""}`}
      data-bar-color={stack.color ?? undefined}
      disabled={disabled || stack.actionPoint === null}
      onClick={() => stack.actionPoint !== null && onSelect(stack.actionPoint)}
      aria-label={`${label}, ${stack.count} taş${stack.movable ? ", oynanabilir" : ""}`}
    >
      <CheckerPile
        stack={stack}
        compact
        draggable={!disabled && dragSource}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("application/x-backgammon-point", "bar");
          onDragSourceChange("bar");
        }}
        onDragEnd={() => onDragSourceChange(null)}
      />
      {stack.count > 0 && <small>{stack.count}</small>}
    </button>
  );
}

function PlayerHud({ player, label, active }: {
  player: BackgammonSession["players"][number] | undefined;
  label: string;
  active: boolean;
}) {
  if (!player) return null;
  return (
    <article className={`backgammon-player-hud ${label === "Sen" ? "is-own" : "is-rival"} ${active ? "is-active" : ""}`} data-color={player.color ?? undefined}>
      <span className="backgammon-player-avatar">{player.ownerName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
      <div><small>{label}</small><strong>{player.ownerName}</strong></div>
      <span className="backgammon-player-color" data-color={player.color ?? undefined}>{player.color === "white" ? "Buz beyazı" : "Gece mavisi"}</span>
      <span className="backgammon-pip"><b>{player.pipCount ?? "-"}</b><small>pip</small></span>
      {active && <span className="backgammon-active-player">Sıra</span>}
    </article>
  );
}

function BearOffTray({ count, color, label }: { count: number; color: "black" | "white"; label: string }) {
  return (
    <span className="backgammon-bearoff-tray" data-color={color}>
      <span className="backgammon-bearoff-checkers" aria-hidden="true">
        {Array.from({ length: Math.min(count, 15) }, (_, index) => <i key={index} />)}
      </span>
      <span><b>{count}<em>/15</em></b><small>{label}</small></span>
    </span>
  );
}

function stateText(session: BackgammonSession) {
  const game = session.game;
  if (!game) return "Rakip bekleniyor";
  if (game.stateKind === "completed") return `${game.winnerName} kazandı`;
  if (game.canRoll) return "Zar atma sırası sende";
  if (game.stateKind === "moving" && game.activeUserId === session.players.find((player) => player.color === session.viewerColor)?.userId) return "Hamleni yap";
  if (game.stateKind === "moving") return `${game.activePlayerName ?? "Rakibin"} hamle yapıyor`;
  return game.activePlayerName ? `Sıra ${game.activePlayerName} oyuncusunda` : "Oyun sürüyor";
}

export function BackgammonBoard({
  session,
  busy,
  connectionState,
  onAction,
  onRequestResign,
}: {
  session: BackgammonSession;
  busy: boolean;
  connectionState: GameConnectionState;
  onAction: (action: GameAction) => void;
  onRequestResign: () => void;
}) {
  const game = session.game;
  const shellRef = useRef<HTMLElement>(null);
  const boardFrameRef = useRef<HTMLDivElement>(null);
  const previousPointCounts = useRef<Map<string, number>>(new Map());
  const animatedMoveRevision = useRef(game?.lastMove?.revision ?? -1);
  const dragOriginRef = useRef<number | "bar" | null>(null);
  const dragCommittedRef = useRef(false);
  const invalidDropTimerRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localSelectedFrom, setLocalSelectedFrom] = useState<number | "bar" | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<number | "bar" | null>(null);
  const [invalidDropFrom, setInvalidDropFrom] = useState<number | "bar" | null>(null);
  const [movingChecker, setMovingChecker] = useState<{
    key: number;
    color: "black" | "white";
    hit: boolean;
    fromX: number;
    fromY: number;
    midX: number;
    midY: number;
    toX: number;
    toY: number;
  } | null>(null);
  const [capturedChecker, setCapturedChecker] = useState<{
    key: number;
    color: "black" | "white";
    fromX: number;
    fromY: number;
    midX: number;
    midY: number;
    toX: number;
    toY: number;
  } | null>(null);

  const changedPointIds = useMemo(() => {
    const changed = new Set<string>();
    if (!game || previousPointCounts.current.size === 0) return changed;
    for (const point of game.points) {
      if (previousPointCounts.current.get(point.id) !== point.count) changed.add(point.id);
    }
    return changed;
  }, [game]);

  useEffect(() => {
    previousPointCounts.current = new Map(game?.points.map((point) => [point.id, point.count]) ?? []);
  }, [game, session.updatedAt]);

  useEffect(() => {
    setLocalSelectedFrom(null);
    setDraggedFrom(null);
    dragOriginRef.current = null;
    dragCommittedRef.current = false;
  }, [session.revision, game?.activeUserId]);

  useEffect(() => () => {
    if (invalidDropTimerRef.current !== null) window.clearTimeout(invalidDropTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    const frame = boardFrameRef.current;
    const lastMove = game?.lastMove;
    if (!frame || !lastMove || lastMove.revision <= animatedMoveRevision.current) return;
    animatedMoveRevision.current = lastMove.revision;
    const color = lastMove.color ?? game.activeColor ?? "black";

    const endpoint = (point: number | "bar" | "off_board", barColor = color) => {
      const selector = point === "bar"
        ? `.backgammon-bar-slot[data-bar-color="${barColor}"]`
        : point === "off_board"
          ? ".backgammon-off-board"
          : `[data-point-id="${point}"]`;
      const surface = frame.querySelector<HTMLElement>(selector);
      const checker = surface?.querySelector<HTMLElement>(".backgammon-checker:last-of-type, .backgammon-bearoff-checkers i:last-child");
      const rect = (checker ?? surface)?.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: rect.left + rect.width / 2 - frameRect.left,
        y: rect.top + rect.height / 2 - frameRect.top,
      };
    };

    const from = endpoint(lastMove.from);
    const to = endpoint(lastMove.to);
    if (!from || !to) return;
    setMovingChecker({
      key: lastMove.revision,
      color,
      hit: lastMove.hit,
      fromX: from.x,
      fromY: from.y,
      midX: (from.x + to.x) / 2,
      midY: (from.y + to.y) / 2 - 14,
      toX: to.x,
      toY: to.y,
    });
    if (lastMove.hit && lastMove.to !== "off_board") {
      const capturedColor = color === "white" ? "black" : "white";
      const capturedFrom = endpoint(lastMove.to);
      const capturedTo = endpoint("bar", capturedColor);
      if (capturedFrom && capturedTo) {
        setCapturedChecker({
          key: lastMove.revision,
          color: capturedColor,
          fromX: capturedFrom.x,
          fromY: capturedFrom.y,
          midX: (capturedFrom.x + capturedTo.x) / 2,
          midY: (capturedFrom.y + capturedTo.y) / 2 - 20,
          toX: capturedTo.x,
          toY: capturedTo.y,
        });
      }
    }
    const timer = window.setTimeout(() => {
      setMovingChecker(null);
      setCapturedChecker(null);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [game?.activeColor, game?.lastMove]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!game) return null;

  function setDragSource(point: number | "bar" | null) {
    if (point !== null) {
      dragOriginRef.current = point;
      dragCommittedRef.current = false;
      setDraggedFrom(point);
      return;
    }
    const origin = dragOriginRef.current;
    if (origin !== null && !dragCommittedRef.current) {
      setInvalidDropFrom(origin);
      if (invalidDropTimerRef.current !== null) window.clearTimeout(invalidDropTimerRef.current);
      invalidDropTimerRef.current = window.setTimeout(() => setInvalidDropFrom(null), 170);
    }
    dragOriginRef.current = null;
    dragCommittedRef.current = false;
    setDraggedFrom(null);
  }

  function commitDragMove(from: number | "bar", to: number | "off_board") {
    dragCommittedRef.current = true;
    setLocalSelectedFrom(null);
    onAction({ type: "move", from, to });
  }

  function selectOrMove(point: number | "bar" | "off_board") {
    if (!game) return;
    if (localSelectedFrom === null) {
      if (point !== "off_board" && game.legalMoves.some((move) => move.from === point)) {
        setLocalSelectedFrom(point);
        return;
      }
      onAction({ type: "point", point });
      return;
    }
    if (point === localSelectedFrom) {
      setLocalSelectedFrom(null);
      return;
    }
    if (point === "bar") return;
    if (game.legalMoves.some((move) => move.from === localSelectedFrom && move.to === point)) {
      commitDragMove(localSelectedFrom, point);
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }
    await shellRef.current?.requestFullscreen();
  }

  const direction = session.players.find((player) => player.color === session.viewerColor)?.direction ?? "clockwise";
  const top = direction === "clockwise"
    ? game.points.slice(12, 24)
    : game.points.slice(0, 12);
  const bottom = direction === "clockwise"
    ? game.points.slice(0, 12).reverse()
    : game.points.slice(12, 24).reverse();
  const ownPlayer = session.players.find((player) => player.color === session.viewerColor);
  const rivalPlayer = ownPlayer ? session.players.find((player) => player.userId !== ownPlayer.userId) : undefined;
  const topPlayer = ownPlayer ? rivalPlayer : session.players[0];
  const bottomPlayer = ownPlayer ?? session.players[1];
  const topDirection = topPlayer?.direction ?? "counterclockwise";
  const bottomDirection = bottomPlayer?.direction ?? "clockwise";
  const targetMode = localSelectedFrom !== null || game.selectedPoint !== null;
  const controlsDisabled = busy || !session.isParticipant;
  const turnDetail = targetMode
    ? { label: "Hedef seç", value: game.remainingDice.join(" · ") || "Hamle seçili" }
    : game.remainingDice.length
      ? { label: "Kalan zarlar", value: game.remainingDice.join(" · ") }
      : game.canRoll
        ? { label: "Tur durumu", value: "Zarını at" }
        : { label: "Tur durumu", value: `${game.activePlayerName ?? "Rakip"} zar atacak` };

  const renderPoint = (point: NonNullable<BackgammonSession["game"]>["points"][number], index: number, side: "top" | "bottom") => {
    const pointId = Number(point.id);
    const locallySelected = localSelectedFrom === pointId;
    const localTarget = localSelectedFrom !== null && game.legalMoves.some((move) => move.from === localSelectedFrom && move.to === pointId);
    const interactivePoint = localSelectedFrom === null
      ? point
      : { ...point, selected: locallySelected, movable: locallySelected || localTarget, actionPoint: locallySelected || localTarget ? pointId : null };
    return (
    <Point
      key={point.id}
      point={interactivePoint}
      index={index}
      side={side}
      direction={direction}
      disabled={controlsDisabled}
      targetMode={targetMode}
      viewerColor={session.viewerColor}
      changed={changedPointIds.has(point.id)}
      lastMove={game.lastMove?.from === Number(point.id) || game.lastMove?.to === Number(point.id)}
      invalidDrop={invalidDropFrom === Number(point.id)}
      dragSource={!targetMode && game.legalMoves.some((move) => move.from === Number(point.id))}
      dragTarget={draggedFrom !== null && game.legalMoves.some((move) => move.from === draggedFrom && move.to === Number(point.id))}
      onDragSourceChange={setDragSource}
      onMove={commitDragMove}
      onSelect={selectOrMove}
    />
    );
  };

  return (
    <section ref={shellRef} className="backgammon-game-shell">
      <header className="backgammon-turn-header" aria-live="polite">
        <div><p className="section-kicker">Canlı masa</p><h2>{stateText(session)}</h2></div>
        <div className="backgammon-header-actions">
          <GameConnectionBadge state={connectionState} />
          <button
            type="button"
            className="backgammon-focus-toggle"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Tam ekrandan çık" : "Masayı tam ekran aç"}
            aria-pressed={isFullscreen}
            title={isFullscreen ? "Tam ekrandan çık" : "Masayı tam ekran aç"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      <div className="backgammon-match-strip">
        <PlayerHud player={topPlayer} label={ownPlayer ? "Rakip" : "1. oyuncu"} active={game.activeUserId === topPlayer?.userId} />
        <span className="backgammon-versus" aria-hidden="true"><i>VS</i><small>{session.visibility === "public" ? "Açık masa" : "Özel masa"}</small></span>
        <PlayerHud player={bottomPlayer} label={ownPlayer ? "Sen" : "2. oyuncu"} active={game.activeUserId === bottomPlayer?.userId} />
      </div>

      <div className="backgammon-table-stage">
          <div ref={boardFrameRef} className="backgammon-board-frame" data-active-color={game.activeColor}>
            <div className="backgammon-board" aria-label="Tavla tahtası">
            <div className="backgammon-point-row is-top">{top.slice(0, 6).map((point, index) => renderPoint(point, index, "top"))}</div>
            <div className="backgammon-bar">
              <BarSlot stack={localSelectedFrom === "bar" ? { ...game.bars[topDirection], movable: true, actionPoint: "bar" } : game.bars[topDirection]} label="Üst bar" disabled={controlsDisabled} dragSource={!targetMode && game.legalMoves.some((move) => move.from === "bar")} lastMove={game.lastMove?.from === "bar"} invalidDrop={invalidDropFrom === "bar"} onDragSourceChange={setDragSource} onSelect={selectOrMove} />
              <span aria-hidden="true" />
              <BarSlot stack={localSelectedFrom === "bar" ? { ...game.bars[bottomDirection], movable: true, actionPoint: "bar" } : game.bars[bottomDirection]} label="Alt bar" disabled={controlsDisabled} dragSource={!targetMode && game.legalMoves.some((move) => move.from === "bar")} lastMove={game.lastMove?.from === "bar"} invalidDrop={invalidDropFrom === "bar"} onDragSourceChange={setDragSource} onSelect={selectOrMove} />
            </div>
            <div className="backgammon-point-row is-top">{top.slice(6).map((point, index) => renderPoint(point, index + 6, "top"))}</div>
              <BackgammonDice dice={game.dice} remainingDice={game.remainingDice} />
              {!game.dice.length && game.stateKind !== "completed" && (
                <div className={`backgammon-board-cue ${game.canRoll ? "is-actionable" : ""}`}>
                  {game.canRoll ? (
                    <button type="button" disabled={busy} onClick={() => onAction({ type: "roll" })}>
                      <Dices size={19} />
                      <span><small>Sıra sende</small><strong>{busy ? "Zarlar hazırlanıyor" : "Zar at"}</strong></span>
                    </button>
                  ) : (
                    <span><i aria-hidden="true" /><span><small>Sıra rakibinde</small><strong>{game.activePlayerName ?? "Rakip"} zar atacak</strong></span></span>
                  )}
                </div>
              )}
              {game.stateKind === "completed" && <GameResultOverlay winner={game.winnerName ?? "Kazanan"} detail="masadan galip ayrıldı" />}
            <div className="backgammon-point-row is-bottom">{bottom.slice(0, 6).map((point, index) => renderPoint(point, index + 12, "bottom"))}</div>
            <div className="backgammon-point-row is-bottom">{bottom.slice(6).map((point, index) => renderPoint(point, index + 18, "bottom"))}</div>
          </div>
          <aside
            className={`backgammon-off-board ${game.offSelectable ? "is-selectable" : ""} ${game.lastMove?.to === "off_board" ? "is-last-move" : ""} ${draggedFrom !== null && game.legalMoves.some((move) => move.from === draggedFrom && move.to === "off_board") ? "is-drag-target" : ""}`}
            aria-label="Toplanan taşlar"
            onDragOver={(event) => {
              if (draggedFrom !== null && game.legalMoves.some((move) => move.from === draggedFrom && move.to === "off_board")) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const raw = event.dataTransfer.getData("application/x-backgammon-point");
              const from = raw === "bar" ? "bar" : Number(raw);
              if ((from === "bar" || Number.isInteger(from)) && game.legalMoves.some((move) => move.from === from && move.to === "off_board")) {
                commitDragMove(from, "off_board");
              }
              setDragSource(null);
            }}
          >
            <BearOffTray count={game.off[topDirection]} color={topPlayer?.color ?? "black"} label={ownPlayer ? "Rakip" : "Üst"} />
            <span className="backgammon-tray-hinge" aria-hidden="true" />
            <button type="button" disabled={!(localSelectedFrom !== null && game.legalMoves.some((move) => move.from === localSelectedFrom && move.to === "off_board")) && (!game.offSelectable || busy)} onClick={() => selectOrMove("off_board")} aria-label="Seçili taşı topla">
              <BearOffTray count={game.off[bottomDirection]} color={bottomPlayer?.color ?? "white"} label={ownPlayer ? "Sen" : "Alt"} />
            </button>
          </aside>
          {movingChecker && (
            <span
              key={movingChecker.key}
              className={`backgammon-moving-checker ${movingChecker.hit ? "is-hit" : ""}`}
              data-color={movingChecker.color}
              style={{
                "--move-from-x": `${movingChecker.fromX}px`,
                "--move-from-y": `${movingChecker.fromY}px`,
                "--move-mid-x": `${movingChecker.midX}px`,
                "--move-mid-y": `${movingChecker.midY}px`,
                "--move-to-x": `${movingChecker.toX}px`,
                "--move-to-y": `${movingChecker.toY}px`,
              } as React.CSSProperties}
              aria-hidden="true"
            ><i /></span>
          )}
          {capturedChecker && (
            <span
              key={`captured-${capturedChecker.key}`}
              className="backgammon-moving-checker is-captured"
              data-color={capturedChecker.color}
              style={{
                "--move-from-x": `${capturedChecker.fromX}px`,
                "--move-from-y": `${capturedChecker.fromY}px`,
                "--move-mid-x": `${capturedChecker.midX}px`,
                "--move-mid-y": `${capturedChecker.midY}px`,
                "--move-to-x": `${capturedChecker.toX}px`,
                "--move-to-y": `${capturedChecker.toY}px`,
              } as React.CSSProperties}
              aria-hidden="true"
            ><i /></span>
          )}
        </div>
      </div>

      {session.isParticipant && (
        <footer className="backgammon-controls">
          <div><small>{turnDetail.label}</small><strong>{turnDetail.value}</strong></div>
          <div className="backgammon-control-actions">
            {(localSelectedFrom !== null || game.selectedPoint !== null) && <button type="button" disabled={busy} onClick={() => localSelectedFrom !== null ? setLocalSelectedFrom(null) : onAction({ type: "cancel" })} className="secondary-action ui-button-md"><Undo2 size={17} /> Seçimi kaldır</button>}
            {game.offSelectable && <button type="button" disabled={busy} onClick={() => onAction({ type: "point", point: "off_board" })} className="secondary-action ui-button-md"><PackageCheck size={17} /> Taşı topla</button>}
            {game.canPass && <button type="button" disabled={busy} onClick={() => onAction({ type: "pass" })} className="secondary-action ui-button-md"><CircleSlash2 size={17} /> Hamle yok, geç</button>}
            {game.stateKind !== "completed" && <button type="button" disabled={busy} onClick={onRequestResign} className="secondary-action ui-button-md backgammon-resign-action"><Flag size={16} /> Oyundan çekil</button>}
          </div>
        </footer>
      )}
    </section>
  );
}
