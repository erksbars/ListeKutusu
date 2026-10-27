"use client";

import { useEffect, useRef } from "react";
import { FEED_RETURN_PAGE_BUDGET, type FeedReturnPhase } from "@/lib/feedRestoration";
import { ContentState } from "./ui/ContentState";
import { Button } from "./ui/Button";

export function FeedReturnNotice({ phase, continueSearch, refresh, dismiss }: {
  phase: FeedReturnPhase; continueSearch: () => void; refresh: () => void; dismiss: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (["paused", "missing", "stalled", "error"].includes(phase)) {
      root.current?.scrollIntoView({ block: "start", behavior: "instant" });
      root.current?.focus({ preventScroll: true });
    }
  }, [phase]);
  if (phase === "idle" || phase === "found") return null;
  const searching = phase === "searching";
  const title = searching ? "Önceki paylaşım aranıyor" : phase === "paused" ? "Paylaşım daha eski bir sayfada olabilir" : phase === "error" ? "Paylaşıma dönüş araması durdu" : phase === "stalled" ? "Akış sayfalaması ilerlemedi" : "Paylaşım bu akışta bulunamadı";
  return <div ref={root} tabIndex={-1} aria-label="Akışa dönüş" className="mt-4">
    <ContentState kind={searching ? "loading" : phase === "error" ? "error" : "unavailable"} title={title} actions={<>
      {(phase === "paused" || phase === "error") && <Button type="button" onClick={continueSearch}>{phase === "error" ? "Aramayı yeniden dene" : "Daha eski paylaşımlarda ara"}</Button>}
      {(phase === "missing" || phase === "stalled") && <Button type="button" onClick={refresh}>Akışı yenile</Button>}
      <Button type="button" variant="ghost" onClick={dismiss}>Aramayı bırak</Button>
    </>}>
      <p>{searching ? `Akış güncel izinlerle yeniden yükleniyor. Her arama en fazla ${FEED_RETURN_PAGE_BUDGET} ek sayfa yükler.` : phase === "paused" ? `Otomatik arama sınırına ulaşıldı. İstersen ${FEED_RETURN_PAGE_BUDGET} ek sayfada daha arayabilirsin.` : phase === "error" ? "Yüklenen paylaşımlar korunuyor. Devam etmek için yeniden dene." : "Paylaşımın görünürlüğü veya akışın sırası değişmiş olabilir. Yüklenen akışı kullanmaya devam edebilirsin."}</p>
    </ContentState>
  </div>;
}
