"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Monochrome 24px outlines: music, TV series, film, book and games.
// Paths avoid platform-dependent emoji rendering and extra DOM nodes.
const SYMBOL_PATHS = [
  "M9 18V5l12-2v13 M9 8l12-2 M9 18a3 3 0 1 1-3-3a3 3 0 0 1 3 3 M21 16a3 3 0 1 1-3-3a3 3 0 0 1 3 3",
  "M8 2l4 4l4-4 M4 7h16v13H4Z M9 23h6",
  "M3 3h18v18H3Z M7 3v18 M17 3v18 M3 8h4 M3 16h4 M17 8h4 M17 16h4 M7 12h10",
  "M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1c3-2 7-2 10-1V4c-3-1-7-1-10 1v16",
  "M7 6h10c3 0 4 3 5 10c.5 4-2 5-4 2l-2-2H8l-2 2c-2 3-4.5 2-4-2c1-7 2-10 5-10Z M5 10v4 M3 12h4 M16 10h.1 M19 13h.1",
] as const;

type AmbientNote = {
  symbol: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
};

function makeNotes(width: number, height: number): AmbientNote[] {
  // 40 at a typical desktop viewport, down from 104; keep all five kinds balanced.
  const count = Math.max(15, Math.min(45, Math.round(width * height / 29_000 / 5) * 5));
  return Array.from({ length: count }, (_, index) => ({
    symbol: index % SYMBOL_PATHS.length,
    x: ((index * 37) % 101) / 100 * width,
    y: ((index * 67) % 103) / 102 * height,
    size: 18 + ((index * 7) % 10),
    speed: 6 + ((index * 11) % 9),
    drift: (index % 2 === 0 ? 1 : -1) * (8 + ((index * 9) % 18)),
    phase: (index * 0.73) % (Math.PI * 2),
  })).sort((a, b) => a.size - b.size);
}

export function AmbientMusicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const isLiveGame = pathname.startsWith("/games/backgammon/") || pathname.startsWith("/games/elimination/");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const paths = SYMBOL_PATHS.map(path => new Path2D(path));
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--ui-accent").trim() || "currentColor";

    let width = 1;
    let height = 1;
    let notes: AmbientNote[] = [];
    let animationFrame = 0;
    let previousFrame = 0;
    let previousTime = performance.now();
    let running = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const ratio = isLiveGame ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      notes = makeNotes(width, height);
    };

    const draw = (time: number) => {
      if (!running) return;
      if (time - previousFrame < (isLiveGame ? 66 : 33)) {
        animationFrame = window.requestAnimationFrame(draw);
        return;
      }
      const elapsed = Math.min(0.08, (time - previousTime) / 1000);
      previousTime = time;
      previousFrame = time;
      context.clearRect(0, 0, width, height);
      const animationTime = reducedMotion ? 0 : time;

      for (const note of notes) {
        if (!reducedMotion) {
          note.y -= note.speed * elapsed;
          if (note.y < -32) note.y = height + 32;
        }
        const sway = Math.sin(animationTime / 4200 + note.phase) * note.drift;
        const opacity = 0.025 + ((Math.sin(animationTime / 4800 + note.phase) + 1) / 2) * 0.065;
        context.save();
        context.translate(note.x + sway - note.size / 2, note.y - note.size / 2);
        context.scale(note.size / 24, note.size / 24);
        context.strokeStyle = accent;
        context.globalAlpha = opacity;
        context.lineWidth = 1.7;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.stroke(paths[note.symbol]);
        context.restore();
      }
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      previousTime = performance.now();
      animationFrame = window.requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    start();
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isLiveGame]);

  return (
    <div className={`ambient-music-background ${isLiveGame ? "is-live-game" : ""}`} aria-hidden="true">
      <span className="ambient-rhythm-line ambient-rhythm-line-one" />
      <span className="ambient-rhythm-line ambient-rhythm-line-two" />
      <canvas ref={canvasRef} className="ambient-note-canvas" />
    </div>
  );
}
