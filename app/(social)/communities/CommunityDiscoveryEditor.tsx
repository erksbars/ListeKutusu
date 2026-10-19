"use client";
import type { CommunityDiscoveryLabels } from "@/lib/communityDiscoveryTypes";
import { Button } from "@/app/components/ui/Button";
import { CommunityDiscoveryFields } from "./CommunityDiscoveryFields";

export function CommunityDiscoveryEditor({ values, disabled, save }: { values: CommunityDiscoveryLabels; disabled: boolean; save: (payload: Record<string, unknown>) => void }) {
  return <details className="ui-panel community-stack"><summary>Keşif bilgilerini düzenle</summary>
    <form key={`${values.universityName}:${values.city}:${values.interest}`} className="community-stack" aria-label="Topluluk keşif bilgileri" onSubmit={event => { event.preventDefault(); save({ action: "update-discovery", ...Object.fromEntries(new FormData(event.currentTarget).entries()) }); }}>
      <fieldset disabled={disabled} className="community-fieldset community-stack"><CommunityDiscoveryFields values={values} /><Button type="submit" variant="primary">Keşif bilgilerini kaydet</Button></fieldset>
    </form>
  </details>;
}
