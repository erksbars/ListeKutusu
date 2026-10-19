"use client";

import { useId } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { Button } from "./ui";
import { ModalPortal } from "./ModalPortal";

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
  onSave?: () => void;
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
  onSave,
}: ConfirmDialogProps) {
  const titleId = useId();

  if (!open) return null;

  return (
    <ModalPortal onEscape={onCancel} busy={busy}><div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!busy) onCancel(); }}>
      <section
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
        {onSave && <Button onClick={onSave} disabled={busy} variant="primary" size="md" className="mt-2 w-full">{busy ? "Kaydediliyor..." : "Kaydet ve devam et"}</Button>}
      </section>
    </div></ModalPortal>
  );
}
