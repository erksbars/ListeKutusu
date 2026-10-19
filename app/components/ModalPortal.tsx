"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const layers: HTMLElement[] = [];
const backgroundState = new Map<HTMLElement, boolean>();
let previousOverflow = "";

function syncBackground() {
  const top = layers.at(-1);
  if (!top) {
    backgroundState.forEach((inert, element) => { element.inert = inert; });
    backgroundState.clear();
    document.body.style.overflow = previousOverflow;
    return;
  }
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (!backgroundState.has(child)) backgroundState.set(child, child.inert);
    child.inert = child !== top;
  }
  document.body.style.overflow = "hidden";
}

/** Keep dialogs outside page stacking contexts and suspend background interaction. */
export function ModalPortal({ children, onEscape, busy = false }: { children: ReactNode; onEscape?: () => void; busy?: boolean }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const behavior = useRef({ onEscape, busy });
  useLayoutEffect(() => { behavior.current = { onEscape, busy }; }, [onEscape, busy]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = document.createElement("div");
    element.className = "ui-modal-layer";
    document.body.append(element);
    if (!layers.length) previousOverflow = document.body.style.overflow;
    layers.push(element);
    syncBackground();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (layers.at(-1) !== element) return;
      if (event.key === "Escape" && behavior.current.onEscape) {
        event.preventDefault();
        event.stopPropagation();
        if (!behavior.current.busy) behavior.current.onEscape();
      }
      if (event.key !== "Tab") return;
      event.stopPropagation();
      const controls = Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(control => !control.matches(':disabled, [aria-disabled="true"]') && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (!element.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    setContainer(element);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      layers.splice(layers.indexOf(element), 1);
      element.remove();
      syncBackground();
      if (previousFocus?.isConnected && !previousFocus.closest("[inert]")) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    if (!container || layers.at(-1) !== container || container.contains(document.activeElement)) return;
    container.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')?.focus({ preventScroll: true });
  }, [container, busy]);

  return container ? createPortal(children, container) : null;
}
