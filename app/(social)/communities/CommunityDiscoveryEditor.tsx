"use client";
import type { CommunityDiscoveryLabels } from "@/lib/communityDiscoveryTypes";
import { Button } from "@/app/components/ui/Button";
import { CommunityDiscoveryFields } from "./CommunityDiscoveryFields";
import { useEffect, useRef, useState } from "react";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";
import { formDraftChanged } from "@/lib/formDraft";

export function CommunityDiscoveryEditor({ values, disabled, busy = false, save }: { values: CommunityDiscoveryLabels; disabled: boolean; busy?: boolean; save: (payload: Record<string, unknown>, done: () => void) => void }) {
  const form = useRef<HTMLFormElement>(null), [dirty, setDirty] = useState(false);
  const baseline = { universityName: values.universityName ?? "", city: values.city ?? "", interest: values.interest ?? "" };
  useEffect(() => setDirty(false), [values.universityName, values.city, values.interest]);
  useDraftNavigationGuard({ dirty, busy, preserveOnLocalNavigation: true,
    discard: () => { form.current?.reset(); setDirty(false); } });
  return <details className="ui-panel community-stack"><summary>Keşif bilgilerini düzenle</summary>
    <form ref={form} key={`${values.universityName}:${values.city}:${values.interest}`} className="community-stack" aria-label="Topluluk keşif bilgileri" onChange={event => setDirty(formDraftChanged(new FormData(event.currentTarget), baseline))} onSubmit={event => { event.preventDefault(); save({ action: "update-discovery", ...Object.fromEntries(new FormData(event.currentTarget).entries()) }, () => { form.current?.reset(); setDirty(false); }); }}>
      <fieldset disabled={disabled} className="community-fieldset community-stack"><CommunityDiscoveryFields values={values} /><Button type="submit" variant="primary">Keşif bilgilerini kaydet</Button></fieldset>
    </form>
  </details>;
}
