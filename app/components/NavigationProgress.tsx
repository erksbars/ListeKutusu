"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ProgressPhase = "idle" | "active" | "finishing";

function isPlainPrimaryClick(event: MouseEvent) {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<ProgressPhase>("idle");
  const phaseRef = useRef<ProgressPhase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phaseRef.current !== "active") return;
    setPhase("finishing");
    const timer = window.setTimeout(() => setPhase("idle"), 180);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    function startProgress(event: MouseEvent) {
      if (!isPlainPrimaryClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
      if (sameDocument) return;

      setPhase("active");
    }

    document.addEventListener("click", startProgress, true);
    return () => document.removeEventListener("click", startProgress, true);
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    const timeout = window.setTimeout(() => setPhase("idle"), 10_000);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  if (phase === "idle") return null;

  return <div className={`navigation-progress navigation-progress-${phase}`} aria-hidden="true"><span /></div>;
}
