"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { draftExitTarget } from "@/lib/draftNavigation";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toast } from "./Toast";

type Draft = { dirty: boolean; busy?: boolean; save?: () => Promise<boolean>; discard?: () => void };
type PendingExit = { proceed: () => void };
type DraftRegistry = { register: (id: string, value: Draft) => () => void; request: (proceed: () => void) => void };
const DraftContext = createContext<DraftRegistry | null>(null);

export function DraftNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const drafts = useRef(new Map<string, Draft>());
  const [target, setTarget] = useState<PendingExit | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const register = useCallback((id: string, value: Draft) => {
    drafts.current.set(id, value);
    return () => { drafts.current.delete(id); };
  }, []);
  const current = useCallback(() => {
    const values = [...drafts.current.values()];
    return { dirty: values.some(value => value.dirty), busy: values.some(value => value.busy) };
  }, []);
  const request = useCallback((proceed: () => void) => {
    const state = current();
    if (state.busy || savingRef.current) {
      setNotice("İşlem sürüyor. Tamamlanınca yeniden deneyebilirsin.");
    } else if (state.dirty) {
      setSaveError(null);
      setTarget({ proceed });
    } else proceed();
  }, [current]);
  const registry = useMemo(() => ({ register, request }), [register, request]);

  useEffect(() => {
    function intercept(event: MouseEvent) {
      if (event.defaultPrevented) return;
      const state = current();
      if (!state.dirty && !state.busy) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link) return;
      const next = draftExitTarget(window.location.href, link.href, { button: event.button, modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey, target: link.target, download: link.hasAttribute("download") });
      if (!next) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      request(() => router.push(next));
    }
    function beforeUnload(event: BeforeUnloadEvent) {
      const state = current();
      if (!state.dirty && !state.busy) return;
      event.preventDefault();
      event.returnValue = "";
    }
    const clearTarget = () => setTarget(null);
    document.addEventListener("click", intercept, true);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", clearTarget);
    return () => {
      document.removeEventListener("click", intercept, true);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", clearTarget);
    };
  }, [current, request, router]);

  const dirtyDrafts = [...drafts.current.values()].filter(draft => draft.dirty);
  // A single explicit edit can be saved; never sequentially auto-publish other forms.
  const canSave = dirtyDrafts.length === 1 && Boolean(dirtyDrafts[0].save);
  async function saveAndContinue() {
    if (!target || savingRef.current || current().busy) return;
    const entries = [...drafts.current.values()].filter(draft => draft.dirty);
    if (entries.length !== 1 || !entries[0].save) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      if (await entries[0].save()) {
        setTarget(null);
        target.proceed();
      } else setSaveError("Kayıt tamamlanamadı. Taslağın ve seçtiğin hedef korunuyor. Tekrar deneyebilir veya bu sayfada kalabilirsin.");
    } catch {
      setSaveError("Kayıt tamamlanamadı. Taslağın ve seçtiğin hedef korunuyor. Tekrar deneyebilirsin.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <DraftContext.Provider value={registry}>
    {children}
    <Toast message={notice} tone="info" onClose={() => setNotice(null)} />
    <ConfirmDialog open={Boolean(target)} title="Değişiklikler kaydedilmedi" body={saveError ?? "Devam edersen kaydedilmemiş değişikliklerin kaybolacak. Kaydetmeden çıkmak taslaklarını yayınlamaz veya kaydetmez."} busy={saving} onSave={canSave ? () => { void saveAndContinue(); } : undefined} confirmLabel="Kaydetmeden çık" onCancel={() => { if (!savingRef.current) setTarget(null); }} onConfirm={() => {
      if (current().busy || savingRef.current || !target) return;
      for (const draft of drafts.current.values()) if (draft.dirty) draft.discard?.();
      setTarget(null);
      target.proceed();
    }} />
  </DraftContext.Provider>;
}

export function useDraftNavigationGuard({ dirty, busy = false, save, discard }: Draft) {
  const registry = useContext(DraftContext), id = useId();
  const state = useMemo(() => ({ dirty, busy, save, discard }), [dirty, busy, save, discard]);
  useEffect(() => registry?.register(id, state), [id, registry, state]);
  return registry?.request ?? ((proceed: () => void) => { if (!dirty && !busy) proceed(); });
}
