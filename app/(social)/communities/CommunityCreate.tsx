"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { COMMUNITY_CATEGORIES } from "@/lib/communityTypes";
import { communityRequestStatus } from "@/lib/communityRequest";
import { PageTopbar } from "@/app/components/PageTopbar";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/app/components/ui/Field";
import { communityFetch, communityError } from "./communityFetch";
import { CommunityDiscoveryFields } from "./CommunityDiscoveryFields";
import { CommunityOwnershipInbox } from "./CommunityOwnershipInbox";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";
import { formDraftChanged } from "@/lib/formDraft";

export function CommunityCreate() {
  const router = useRouter(), createForm = useRef<HTMLFormElement>(null), savingRef = useRef(false);
  const [authenticated, setAuthenticated] = useState(false), [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false), [createDirty, setCreateDirty] = useState(false);
  const [createError, setCreateError] = useState(""), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useDraftNavigationGuard({ dirty: authenticated && createDirty, busy: saving,
    discard: () => { createForm.current?.reset(); setCreateDirty(false); } });
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    communityFetch<{ list: { id: string } }>("/api/accounts/me?view=summary", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setAuthenticated(Boolean(result.list?.id)); })
      .catch(cause => { if (!controller.signal.aborted) { if ([401, 403, 404].includes(communityRequestStatus(cause) ?? 0)) { setAuthenticated(false); setCreateDirty(false); } else setError(communityError(cause)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title="Topluluk oluştur" subtitle="Ortak meraklara yeni bir alan aç." icon={<Users size={22} />} />
    <div className="community-columns mt-6">
      <section className="ui-panel community-stack" aria-label="Yeni topluluk">
        {loading && <p role="status">Hesabın kontrol ediliyor…</p>}
        {error && <div role="alert"><p>{error}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Yeniden dene</Button></div>}
        <h2 className="ui-section-title">Topluluğunu tanıtalım</h2>
        <p>Bir ad seç, ne konuşacağınızı anlat ve katılacaklar için kurallarını ekle.</p>
        {authenticated ? <form ref={createForm} className="community-stack" aria-label="Topluluk oluşturma" onChange={event => setCreateDirty(formDraftChanged(new FormData(event.currentTarget), { name: "", category: "interest", universityName: "", city: "", interest: "", description: "", rules: "" }))} onSubmit={async event => {
          event.preventDefault(); if (savingRef.current) return;
          const fields = new FormData(event.currentTarget);
          savingRef.current = true; setSaving(true); setCreateError("");
          try { const result = await communityFetch<{ slug: string }>("/api/communities", Object.fromEntries(fields.entries())); if (typeof result?.slug !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/u.test(result.slug)) throw new Error("Topluluk yanıtı doğrulanamadı. Formun korunuyor; yeniden oluşturmadan önce topluluklarını kontrol et."); setCreateDirty(false); router.push(`/communities/${result.slug}`); }
          catch (error) { setCreateError(communityError(error)); }
          finally { savingRef.current = false; setSaving(false); }
        }}><fieldset disabled={saving || loading} className="community-fieldset community-stack">
          <TextField label="Topluluk adı" name="name" minLength={3} maxLength={60} required />
          <SelectField label="Kategori" name="category">{Object.entries(COMMUNITY_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
          <CommunityDiscoveryFields />
          <TextAreaField label="Açıklama" name="description" minLength={10} maxLength={600} rows={3} required />
          <TextAreaField label="Topluluk kuralları" name="rules" minLength={10} maxLength={2000} rows={4} required hint="Katılımcılardan beklediğin davranışları açıkça yaz." />
          {createError && <p role="alert" className="community-error">{createError}</p>}<Button type="submit" variant="primary" loading={saving}>Topluluk oluştur</Button>
        </fieldset></form> : !loading && !error && <Link href="/account?mode=login&next=%2Fcommunities%2Fcreate">Topluluk oluşturmak için giriş yap ↗</Link>}
      </section>
      <aside className="community-stack"><section className="ui-panel community-stack"><h2 className="ui-section-title">İyi bir başlangıç</h2><p>Kısa ve ayırt edici bir ad seç.</p><p>Konuyu ve kimlere açık olduğunu açıklamada belirt.</p><p>Saygı, spoiler ve kişisel bilgi paylaşımı için net kurallar koy.</p><p>Topluluğun herkese açık okunur. Paylaşımlarını topluluğa özel veya genel akışta gösterebilirsin.</p></section>
      {authenticated && <><CommunityOwnershipInbox /><Link href="/community-cases">Topluluk başvurularım ↗</Link></>}</aside>
    </div>
  </section></main>;
}
