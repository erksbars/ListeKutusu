"use client";
import { Bookmark, Heart } from "lucide-react";
import type { CommunityPostReactionState } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";

export function CommunityPostReactions({ state, authenticated, disabled, change, className = "community-actions" }: { state: CommunityPostReactionState; authenticated: boolean; disabled: boolean; change: (action: "set-like" | "set-save", active: boolean) => void; className?: string }) {
  return <div className={className} role="group" aria-label="Paylaşım etkileşimleri">
    <span>{state.likeCount ?? 0} beğeni</span>
    {authenticated && <><Button type="button" title="Kendi paylaşımını beğenemezsin. Yeni beğeni için açık topluluk ve aktif üyelik gerekir." variant={state.viewerLiked ? "primary" : "secondary"} aria-pressed={Boolean(state.viewerLiked)} disabled={disabled || (!state.canLike && !state.viewerLiked)} onClick={() => change("set-like", !state.viewerLiked)}><Heart size={16} aria-hidden="true" />{state.viewerLiked ? "Beğeniyi kaldır" : "Beğen"}</Button>
      <Button type="button" title="Kayıt yalnız sana özeldir. Yeni kayıt için açık topluluk ve aktif üyelik gerekir." aria-pressed={Boolean(state.viewerSaved)} disabled={disabled || (!state.canSave && !state.viewerSaved)} onClick={() => change("set-save", !state.viewerSaved)}><Bookmark size={16} aria-hidden="true" />{state.viewerSaved ? "Kaydı kaldır" : "Kaydet"}</Button></>}
  </div>;
}
