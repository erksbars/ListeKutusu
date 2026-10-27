"use client";
import type { CommunityEventDetail } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";
import { TextAreaField, TextField } from "@/app/components/ui/Field";
import { CommunityDistributionField } from "@/app/components/CommunityDistributionField";
import { useRef, useState } from "react";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";

function localTime(iso: string) { return new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16); }
export function CommunityEventEditor({ event, busy, onSave, onCancel }: { event: CommunityEventDetail["event"]; busy: boolean; onSave: (payload: Record<string, unknown>) => void; onCancel: () => void }) {
  const [dirty, setDirty] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const requestExit = useDraftNavigationGuard({ dirty, busy, discard: () => { form.current?.reset(); setDirty(false); } });
  return <form ref={form} className="ui-panel community-stack" aria-label="Etkinlik düzenleme" onChange={e => {
    const fields = new FormData(e.currentTarget);
    const initial = { title: event.title, description: event.description, localStart: localTime(event.startsAt), city: event.city, venue: event.venue, capacity: String(event.capacity ?? ""), distribution: event.distribution };
    setDirty(Object.entries(initial).some(([key, value]) => String(fields.get(key) ?? "") !== value) || fields.has("publicLocationConfirmed"));
  }} onSubmit={e => {
    e.preventDefault(); const fields = new FormData(e.currentTarget), capacity = String(fields.get("capacity") ?? "");
    onSave({ title: fields.get("title"), description: fields.get("description"), localStart: fields.get("localStart"), timeZone: "Europe/Istanbul", city: fields.get("city"), venue: fields.get("venue"), capacity: capacity === "" ? null : Number(capacity), distribution: fields.get("distribution"), publicLocationConfirmed: fields.get("publicLocationConfirmed") === "on", expectedVersion: event.contentVersion });
  }}>
    <h3>Etkinliği düzenle</h3><p>Değişiklikler katılım tercihini korur. Katılacağım/İlgileniyorum diyen uygun üyelere uygulama içi bildirim gönderilir. Kapasite mevcut katılımın altına indirilemez.</p>
    <fieldset disabled={busy} className="community-fieldset community-stack">
      <TextField label="Etkinlik başlığı" name="title" defaultValue={event.title} minLength={3} maxLength={120} required />
      <TextAreaField label="Etkinlik açıklaması" name="description" defaultValue={event.description} minLength={20} maxLength={5000} rows={4} required />
      <TextField label="Başlangıç tarihi ve saati" name="localStart" type="datetime-local" defaultValue={localTime(event.startsAt)} hint="Türkiye saati (Europe/Istanbul)." required />
      <TextField label="Şehir" name="city" defaultValue={event.city} minLength={2} maxLength={80} required />
      <TextField label="Mekân" name="venue" defaultValue={event.venue} minLength={3} maxLength={160} required />
      <TextField label="Katılımcı kapasitesi (isteğe bağlı)" name="capacity" type="number" defaultValue={event.capacity ?? ""} min={2} max={200} step={1} />
      <label className="community-check"><input type="checkbox" name="publicLocationConfirmed" required />Güncel etkinlik ve mekân bilgilerinin herkese açık olduğunu biliyorum.</label>
      <CommunityDistributionField defaultValue={event.distribution} />
      <div className="community-actions"><Button type="submit" variant="primary" loading={busy}>Değişiklikleri kaydet</Button><Button type="button" onClick={() => requestExit(onCancel, true)}>Düzenlemeden vazgeç</Button></div>
    </fieldset>
  </form>;
}
