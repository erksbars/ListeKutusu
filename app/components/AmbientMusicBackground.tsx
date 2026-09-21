"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const NOTE_COUNT = 104;
const NOTE_SYMBOLS = ["♪", "♫", "♩", "♬"] as const;

type AmbientNote = {
  symbol: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
};

function makeNotes(width: number, height: number): AmbientNote[] {
  return Array.from({ length: NOTE_COUNT }, (_, index) => ({
    symbol: NOTE_SYMBOLS[index % NOTE_SYMBOLS.length],
    x: ((index * 37) % 101) / 100 * width,
    y: ((index * 67) % 103) / 102 * height,
    size: 12 + ((index * 7) % 12),
    speed: 8 + ((index * 11) % 14),
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
      context.textAlign = "center";
      context.textBaseline = "middle";
      const animationTime = reducedMotion ? 0 : time;

      let currentFontSize = -1;
      for (const note of notes) {
        if (!reducedMotion) {
          note.y -= note.speed * elapsed;
          if (note.y < -32) note.y = height + 32;
        }
        const sway = Math.sin(animationTime / 4200 + note.phase) * note.drift;
        const opacity = 0.035 + ((Math.sin(animationTime / 3600 + note.phase) + 1) / 2) * 0.09;
        if (currentFontSize !== note.size) {
          currentFontSize = note.size;
          context.font = `700 ${note.size}px system-ui, sans-serif`;
        }
        context.fillStyle = `rgba(47, 211, 202, ${opacity})`;
        context.fillText(note.symbol, note.x + sway, note.y);
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
