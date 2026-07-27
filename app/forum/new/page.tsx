"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lightbulb, ListChecks, MessageSquarePlus, RefreshCw, Save, Send } from "lucide-react";
import { FORUM_CATEGORY_GROUPS, forumThreadGuidance } from "@/lib/forum";
import { Toast } from "@/app/components/Toast";
import { AccountMenu } from "@/app/components/AccountMenu";
import { MobileDock } from "@/app/components/MobileDock";
import { PageTopbar } from "@/app/components/PageTopbar";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { Button, SelectField, TextAreaField, TextField } from "@/app/components/ui";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";

type Account = {
  ownerName: string;
  email: string | null;
  slug: string;
  role?: string | null;
};

const FORUM_DRAFT_KEY = "listekutusu:forum-draft";

export default function NewForumThreadPage() {
  const router = useRouter();
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [groupId, setGroupId] = useState("muzik");
  const [category, setCategory] = useState("genel");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const [bodyTouched, setBodyTouched] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const selectedGroup =
    FORUM_CATEGORY_GROUPS.find((item) => item.id === groupId) ?? FORUM_CATEGORY_GROUPS[0];
  const selectedCategory =
    selectedGroup.categories.find((item) => item.id === category) ?? selectedGroup.categories[0];
  const guidance = forumThreadGuidance(selectedCategory.id);
  const titleError =
    titleTouched && title.trim().length < 8 ? "Başlık en az 8 karakter olmalı." : "";
  const bodyError =
    bodyTouched && body.trim().length < 30 ? "Açıklama en az 30 karakter olmalı." : "";

  const checkAccount = useCallback(async () => {
    setChecking(true);
    setAuthError(null);
    try {
      const response = await fetch("/api/accounts/me");
      if (response.status === 401) {
        goToLogin("/forum/new");
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Hesap bilgileri alınamadı.");
      setAccount(data?.list || null);
    } catch {
      setAuthError("Hesabın doğrulanamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setChecking(false);
    }
  }, [goToLogin]);

  useEffect(() => {
    void checkAccount();
  }, [checkAccount]);

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(FORUM_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as { groupId?: string; category?: string; title?: string; body?: string };
        const draftGroup = FORUM_CATEGORY_GROUPS.find((item) => item.id === draft.groupId);
        const draftCategory = draftGroup?.categories.find((item) => item.id === draft.category);
        if (draftGroup && draftCategory) {
          setGroupId(draftGroup.id);
          setCategory(draftCategory.id);
        }
        setTitle(typeof draft.title === "string" ? draft.title.slice(0, 120) : "");
        setBody(typeof draft.body === "string" ? draft.body.slice(0, 5000) : "");
      }
    } catch {
      window.sessionStorage.removeItem(FORUM_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const timeout = window.setTimeout(() => {
      if (!title.trim() && !body.trim()) {
        window.sessionStorage.removeItem(FORUM_DRAFT_KEY);
        return;
      }
      window.sessionStorage.setItem(FORUM_DRAFT_KEY, JSON.stringify({ groupId, category, title, body }));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [body, category, draftReady, groupId, title]);

  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [body, title]);

  async function logoutAccount() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        goToLogin("/forum/new");
        return;
      }
      if (!response.ok) throw new Error(data?.error || "Konu gönderilemedi.");
      window.sessionStorage.removeItem(FORUM_DRAFT_KEY);
      setTitle("");
      setBody("");
      setMessage(data.message || "Konu moderatör onayına gönderildi.");
      window.setTimeout(() => router.push(`/forum/${data.thread.slug}`), 700);
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "Konu gönderilemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-28 text-white sm:px-6 xl:pb-16">
      <Toast message={message} onClose={() => setMessage(null)} />
      <ConfirmDialog
        open={confirmLeave}
        title="Taslak kapatılsın mı?"
        body="Yazdıkların bu sekmedeki taslaktan silinecek ve forum ana sayfasına dönülecek."
        confirmLabel="Taslağı sil ve çık"
        tone="danger"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          window.sessionStorage.removeItem(FORUM_DRAFT_KEY);
          setTitle("");
          setBody("");
          setConfirmLeave(false);
          router.push("/forum");
        }}
      />
      <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} active="forum" />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Yeni konu"
          subtitle="Topluluğa açık bir tartışma başlat"
          icon={<MessageSquarePlus size={19} />}
          backHref="/forum"
          backLabel="Foruma dön"
          actions={account && (
            <AccountMenu
              ownerName={account.ownerName}
              email={account.email}
              profileSlug={account.slug}
              role={account.role}
              onLogout={() => void logoutAccount()}
            />
          )}
        />

        {checking ? (
          <div className="forum-create-skeleton mt-6" role="status" aria-live="polite" aria-label="Hesap kontrol ediliyor">
            <section><i /><i /><b /><b /><b /></section>
            <aside><span /><i /><i /></aside>
          </div>
        ) : authError ? (
          <section className="forum-detail-error mt-6 text-center" role="alert">
            <p>{authError}</p>
            <Button variant="primary" onClick={() => void checkAccount()} className="mt-4" leadingIcon={<RefreshCw size={16} />}>
              Tekrar dene
            </Button>
          </section>
        ) : (
          <div className="forum-create-layout mt-6">
          <form onSubmit={submit} className="forum-create-form">
            <div className="max-w-2xl">
              <p className="section-kicker">Konu bilgileri</p>
              <h2>Sorunu anlaşılır biçimde anlat</h2>
              <p className="forum-create-intro">Doğru bölüm ve yeterli bağlam, daha hızlı ve yararlı yanıt almanı sağlar.</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SelectField
                id="forum-group"
                label="Ana bölüm"
                value={groupId}
                onChange={(event) => {
                  const nextGroup = FORUM_CATEGORY_GROUPS.find((item) => item.id === event.target.value) ?? FORUM_CATEGORY_GROUPS[0];
                  setGroupId(nextGroup.id);
                  setCategory(nextGroup.categories[0].id);
                }}
                className="forum-form-select h-12 text-sm font-bold"
              >
                {FORUM_CATEGORY_GROUPS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </SelectField>
              <SelectField
                id="forum-category"
                label="Alt forum"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="forum-form-select h-12 text-sm font-bold"
              >
                {(FORUM_CATEGORY_GROUPS.find((item) => item.id === groupId) ?? FORUM_CATEGORY_GROUPS[0]).categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </SelectField>
            </div>
            <p className="forum-selected-category-copy">{selectedGroup.label} / {selectedCategory.label}: {selectedCategory.description}</p>

            <TextField
              id="forum-title"
              label="Başlık"
              labelMeta={`${title.length}/120`}
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 120))}
              onBlur={() => setTitleTouched(true)}
              minLength={8}
              required
              error={titleError || undefined}
              hint="Sorunu veya tartışma konusunu tek cümlede özetle."
              placeholder={guidance.titlePlaceholder}
              fieldClassName="mt-5"
              className="forum-form-input h-12 text-sm"
            />

            <TextAreaField
              id="forum-body"
              label="Açıklama"
              labelMeta={`${body.length}/5000`}
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 5000))}
              onBlur={() => setBodyTouched(true)}
              minLength={30}
              required
              rows={12}
              error={bodyError || undefined}
              hint="Kullandığın ekipmanı, denediğin adımları ve beklediğin sonucu belirt."
              placeholder={guidance.bodyPlaceholder}
              fieldClassName="mt-5"
              className="forum-form-input min-h-[288px] text-sm leading-6"
            />

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-50/68"><Save size={14} />Taslak bu sekmede otomatik korunur.</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => title.trim() || body.trim() ? setConfirmLeave(true) : router.push("/forum")}>Vazgeç</Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={title.trim().length < 8 || body.trim().length < 30}
                  leadingIcon={<Send size={16} />}
                >
                  Onaya gönder
                </Button>
              </div>
            </div>
          </form>
          <aside className="forum-create-guide">
            <section>
              <span><Lightbulb size={18} /></span>
              <div>
                <p className="section-kicker">Seçili alt forum</p>
                <h2>{selectedCategory.label}</h2>
                <p>{selectedCategory.description}</p>
              </div>
            </section>
            <section>
              <span><ListChecks size={18} /></span>
              <div>
                <p className="section-kicker">Göndermeden önce</p>
                <ul>
                  {guidance.checklist.map((item) => (
                    <li key={item}><CheckCircle2 size={14} />{item}</li>
                  ))}
                </ul>
              </div>
            </section>
            <p>Yeni konular yayınlanmadan önce moderatör kontrolünden geçer.</p>
          </aside>
          </div>
        )}
      </section>
    </main>
  );
}
