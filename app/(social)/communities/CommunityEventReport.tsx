"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { TextAreaField } from "@/app/components/ui/Field";

export function CommunityEventReport({ busy, submit }: { busy: boolean; submit: (reason: string, done: () => void) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) return <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(true)}>Etkinliği bildir</Button>;
  return <form className="community-stack community-divider" aria-label="Etkinlik bildirimi" onSubmit={event => {
    event.preventDefault(); submit(reason, () => { setReason(""); setOpen(false); });
  }}>
    <p>Bildirim topluluğun kurucu ve moderatörlerine gider; etkinlik otomatik gizlenmez. Kişisel veya hassas bilgi ekleme. Acil yardım kanalı değildir.</p>
    <TextAreaField label="Etkinlik bildirim nedeni" value={reason} onChange={event => setReason(event.target.value)} minLength={3} maxLength={300} rows={3} required disabled={busy} />
    <div className="community-actions"><Button type="submit" loading={busy}>Etkinlik bildirimi gönder</Button><Button type="button" disabled={busy} onClick={() => setOpen(false)}>Bildirimden vazgeç</Button></div>
  </form>;
}
