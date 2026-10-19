"use client";
import { useEffect, useState } from "react";
import type { CommunityPostDetail } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/app/components/ui/Field";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";

export function CommunityReviewEditor({ post, disabled, save, cancel, requestCancel, dirtyChanged }: { post: CommunityPostDetail["post"]; disabled: boolean; save: (payload: Record<string, unknown>, done: () => void) => void; cancel: () => void; requestCancel?: () => void; dirtyChanged?: (dirty: boolean) => void }) {
  const [title, setTitle] = useState(post.title), [body, setBody] = useState(post.body);
  const [rating, setRating] = useState(String(post.rating)), [spoiler, setSpoiler] = useState(post.spoiler);
  const dirty = title !== post.title || body !== post.body || rating !== String(post.rating) || spoiler !== post.spoiler;
  useDraftNavigationGuard({ dirty, busy: dirty && disabled });
  useEffect(() => dirtyChanged?.(dirty), [dirty, dirtyChanged]);
  return <form className="ui-panel community-stack" aria-label="İnceleme düzenleme" onSubmit={event => { event.preventDefault(); save({ action: "edit-review", postId: post.id, expectedRevision: post.revision, title, body, rating: Number(rating), spoiler }, cancel); }}>
    <h3>İncelemeni düzenle</h3><p>Eser ve kaynak bilgisi değişmez. Yeni metin, puan ve spoiler tercihi herkese açık incelemeye uygulanır. Başlığa spoiler yazma. Yenileme veya sayfadan ayrılma taslağı siler.</p>
    <fieldset disabled={disabled} className="community-fieldset community-stack">
      <TextField label="İnceleme başlığı" value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={120} required />
      <TextAreaField label="İnceleme metni" value={body} onChange={event => setBody(event.target.value)} minLength={20} maxLength={5000} rows={6} required />
      <SelectField label="Güncel puanın" value={rating} onChange={event => setRating(event.target.value)}>{Array.from({ length: 10 }, (_, index) => <option key={index} value={index + 1}>{index + 1}/10</option>)}</SelectField>
      <label className="community-check"><input type="checkbox" checked={spoiler} onChange={event => setSpoiler(event.target.checked)} />Düzenlenen inceleme spoiler içeriyor</label>
      <div className="community-actions"><Button type="submit" variant="primary">İnceleme değişikliklerini kaydet</Button><Button type="button" onClick={requestCancel ?? cancel}>Düzenlemeden vazgeç</Button></div>
    </fieldset>
  </form>;
}
