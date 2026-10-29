"use client";
import { useState } from "react";
import type { GeneralCommunityItem } from "@/lib/communityGeneralFeed";
import type { CommunityPostDetail } from "@/lib/communityTypes";
import { useCommunityRead } from "../(social)/communities/useCommunityRead";
import { Button } from "./ui/Button";
import { CommunityCardActions } from "./CommunityCardActions";
import { CommunityInlineComments } from "./CommunityInlineComments";
import { ExpandablePostText } from "./ExpandablePostText";
import { TVmazeAttribution } from "./TVmazeAttribution";
import styles from "./CommunityGeneralFeed.module.css";

export function CommunityPostContent({ item, viewerId, surface, returnTo, onUnsave, onUnavailable }: { item: Extract<GeneralCommunityItem, { kind: "post" }>; viewerId: string | null; surface: "feed" | "saved"; returnTo: string; onUnsave?: () => void; onUnavailable: () => void }) {
  const [revealed, setRevealed] = useState(false), [retry, setRetry] = useState(0);
  const read = useCommunityRead<CommunityPostDetail>(`/api/communities/${encodeURIComponent(item.community.slug)}/posts/${encodeURIComponent(item.id)}?page=1`, `${viewerId}:${retry}`, item.spoiler && revealed);
  const current = read.data?.post?.id === item.id && typeof read.data.post.body === "string" ? read.data : null;
  const readError = read.error || (read.data && !current ? "İnceleme yanıtı doğrulanamadı. Yeniden deneyebilirsin." : "");
  return <>
    {item.referenceProvider === "tvmaze" && <p><TVmazeAttribution /></p>}
    {item.spoiler ? <div className={styles.spoiler}>
      <Button type="button" aria-expanded={revealed} onClick={() => setRevealed(value => !value)}>{revealed ? "Spoilerı gizle" : "Spoiler içeren metni göster"}</Button>
      {revealed && <>{read.loading && <p role="status">İnceleme yükleniyor…</p>}{readError && <div role="alert"><p>{readError}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Yeniden dene</Button></div>}{current && <ExpandablePostText text={current.post.body} />}</>}
    </div> : <ExpandablePostText text={item.content ?? item.excerpt} />}
    <footer className={styles.footer}><CommunityCardActions initial={item} slug={item.community.slug} postId={item.id} viewerId={viewerId} surface={surface} loginReturnTo={returnTo} onUnsave={onUnsave} onUnavailable={onUnavailable} /></footer>
    <CommunityInlineComments slug={item.community.slug} postId={item.id} viewerId={viewerId} spoiler={item.spoiler} spoilerApproved={revealed} onReveal={() => setRevealed(true)} returnTo={returnTo} />
  </>;
}
