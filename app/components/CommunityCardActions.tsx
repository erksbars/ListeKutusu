"use client";
import Link from "next/link";
import { accountLoginPath } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import type { CommunityPostReactionState } from "@/lib/communityTypes";
import { CommunityPostReactions } from "../(social)/communities/CommunityPostReactions";
import { communityError, communityFetch } from "../(social)/communities/communityFetch";
import styles from "./CommunityGeneralFeed.module.css";
import { useDraftNavigationGuard, useDraftNavigationRequest } from "./DraftNavigationProvider";

export function CommunityCardActions({ initial, slug, postId, viewerId, surface, onUnsave, onUnavailable, loginReturnTo = "/" }: { initial: CommunityPostReactionState; slug: string; postId: string; viewerId: string | null; surface: "feed" | "saved" | "community"; onUnsave?: () => void; onUnavailable: () => void; loginReturnTo?: string }) {
  const [state, setState] = useState(initial), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false), pending = useRef(false), generation = useRef(0);
  useDraftNavigationGuard({ dirty: false, busy });
  const requestExit = useDraftNavigationRequest(true);
  useEffect(() => { const version = ++generation.current; setState(initial); setUnavailable(false); setError(""); return () => { generation.current = version + 1; }; }, [initial, viewerId]);
  async function change(action: "set-like" | "set-save", active: boolean) {
    if (pending.current) return;
    const current = generation.current;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await communityFetch<{ reactionState: CommunityPostReactionState | null }>(`/api/communities/${encodeURIComponent(slug)}`, { action, active, postId, surface });
      if (generation.current !== current) return;
      if (result.reactionState) setState(result.reactionState); else { setUnavailable(true); onUnavailable(); }
      if (action === "set-save" && !active) onUnsave?.();
    } catch (cause) { if (generation.current === current) setError(communityError(cause)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    {unavailable ? <p role="status">Bu paylaşım artık bu görünümde bulunmuyor. Listeyi yenileyebilirsin.</p> : <CommunityPostReactions className={styles.reactions} state={state} authenticated={Boolean(viewerId)} disabled={busy} change={(action, active) => {
      if (action === "set-save" && !active && onUnsave) requestExit(() => void change(action, active));
      else void change(action, active);
    }} />}
    {error && <p role="alert">{error}</p>}
    {!viewerId ? <Link href={accountLoginPath(loginReturnTo)}>Etkileşim için giriş yap ↗</Link> : !state.canSave && !state.viewerSaved && !unavailable && <p>Yeni etkileşim için açık topluluk ve aktif üyelik gerekir.</p>}
  </>;
}
