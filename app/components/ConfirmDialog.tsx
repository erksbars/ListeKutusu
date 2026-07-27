"use client";

import { useEffect, useId, useRef } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { Button } from "./ui";

type ConfirmTone = "default" | "danger";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCancelRef = useRef(onCancel);
  const titleId = useId();

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!busy) onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [busy, open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!busy) onCancel(); }}>
      <section
        ref={dialogRef}
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={
              "confirm-icon " +
              (tone === "danger" ? "confirm-icon-danger" : "confirm-icon-info")
            }
            aria-hidden="true"
          >
            {tone === "danger" ? <TriangleAlert size={19} /> : <Info size={19} />}
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-black text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-cyan-50/76">{body}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_1fr]">
          <Button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={busy}
            variant="secondary"
            size="md"
            className="w-full"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            loading={busy}
            variant={tone === "danger" ? "danger" : "primary"}
            size="md"
            className="w-full"
          >
            {busy ? "İşleniyor..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
