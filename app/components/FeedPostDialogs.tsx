"use client";

import type { RefObject } from "react";
import { Button, TextAreaField, TextField } from "./ui";

type DialogRef = RefObject<HTMLElement>;

type FeedReportDialogProps = {
  open: boolean;
  dialogRef: DialogRef;
  reason: string;
  details: string;
  submitting: boolean;
  onReasonChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function FeedReportDialog({
  open,
  dialogRef,
  reason,
  details,
  submitting,
  onReasonChange,
  onDetailsChange,
  onCancel,
  onSubmit,
}: FeedReportDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!submitting) onCancel(); }}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="confirm-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/68">Topluluk güvenliği</p>
        <h2 id="report-dialog-title" className="mt-2 text-xl font-black text-white">Paylaşımı şikâyet et</h2>
        <p className="mt-2 text-sm leading-6 text-cyan-50/68">
          En uygun nedeni seç. Şikâyetin paylaşım sahibine gösterilmez.
        </p>
        <label htmlFor="report-reason" className="ui-form-label mt-5 block">Şikâyet nedeni</label>
        <select
          id="report-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          className="ui-field mt-2"
        >
          <option value="spam">Spam veya tekrar</option>
          <option value="abuse">Taciz veya nefret</option>
          <option value="misleading">Yanıltıcı içerik</option>
          <option value="copyright">Telif hakkı</option>
          <option value="other">Diğer</option>
        </select>
        <TextAreaField
          fieldClassName="mt-3"
          label="Açıklama"
          hint={`${details.length}/300 · İsteğe bağlı`}
          value={details}
          onChange={(event) => onDetailsChange(event.target.value.slice(0, 300))}
          placeholder="İstersen kısa bir açıklama ekle..."
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" onClick={onCancel} disabled={submitting} variant="secondary">Vazgeç</Button>
          <Button type="button" onClick={onSubmit} loading={submitting} variant="danger">
            Şikâyeti gönder
          </Button>
        </div>
      </section>
    </div>
  );
}

export type FeedEditState = {
  id: string;
  note: string;
  tags: string;
};

type FeedEditDialogProps = {
  value: FeedEditState | null;
  dialogRef: DialogRef;
  saving: boolean;
  onChange: (value: FeedEditState) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function FeedEditDialog({ value, dialogRef, saving, onChange, onCancel, onSave }: FeedEditDialogProps) {
  if (!value) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!saving) onCancel(); }}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-post-dialog-title"
        className="confirm-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/68">Paylaşım ayarları</p>
        <h2 id="edit-post-dialog-title" className="mt-2 text-xl font-black text-white">Paylaşımı düzenle</h2>
        <TextAreaField
          fieldClassName="mt-5"
          label="Paylaşım açıklaması"
          labelMeta={`${value.note.length}/400`}
          hint="İsteğe bağlı. Şarkıyı neden seçtiğini anlatabilirsin."
          value={value.note}
          maxLength={400}
          rows={4}
          onChange={(event) => onChange({ ...value, note: event.target.value.slice(0, 400) })}
          placeholder="Bu şarkıyı neden paylaşıyorsun?"
        />
        <TextField
          fieldClassName="mt-3"
          label="Etiketler"
          hint="Virgülle ayır; en fazla dört etiket gösterilir."
          value={value.tags}
          onChange={(event) => onChange({ ...value, tags: event.target.value })}
          placeholder="Etiketler: rock, gece, keşif"
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" onClick={onCancel} disabled={saving} variant="secondary">Vazgeç</Button>
          <Button type="button" onClick={onSave} loading={saving}>Kaydet</Button>
        </div>
      </section>
    </div>
  );
}
