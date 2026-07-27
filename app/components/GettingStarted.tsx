"use client";

import Link from "next/link";
import { Check, ChevronRight, Heart, ListPlus, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type OnboardingState = {
  profileComplete: boolean;
  feedPosts: number;
  feedLikes: number;
  feedAdds: number;
};

type GettingStartedProps = {
  initial: OnboardingState;
};

const HIDDEN_UNTIL_KEY = "listekutusu_onboarding_hidden_until";

export function GettingStarted({ initial }: GettingStartedProps) {
  const [state, setState] = useState(initial);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setState(initial);
    const hiddenUntil = Number(window.localStorage.getItem(HIDDEN_UNTIL_KEY) || 0);
    setHidden(hiddenUntil > Date.now());
  }, [initial]);

  useEffect(() => {
    async function refresh() {
      const response = await fetch("/api/accounts/me");
      const data = await response.json().catch(() => null);
      if (response.ok && data?.list?.onboarding) setState(data.list.onboarding);
    }
    window.addEventListener("onboarding:refresh", refresh);
    return () => window.removeEventListener("onboarding:refresh", refresh);
  }, []);

  const steps = useMemo(() => [
    { label: "Profilini tamamla", done: state.profileComplete, href: "/account?tab=profile", icon: UserRound },
    { label: "İlk şarkını paylaş", done: state.feedPosts > 0, href: "#feed-composer", icon: Sparkles },
    { label: "Bir keşfi beğen", done: state.feedLikes > 0, href: "#feed-posts", icon: Heart },
    { label: "Listene ilk parçayı ekle", done: state.feedAdds > 0, href: "#feed-posts", icon: ListPlus },
  ], [state]);

  const completed = steps.filter((step) => step.done).length;
  if (hidden || completed === steps.length) return null;

  function hideForNow() {
    window.localStorage.setItem(HIDDEN_UNTIL_KEY, String(Date.now() + 7 * 86_400_000));
    setHidden(true);
  }

  return (
    <section className="getting-started" aria-labelledby="getting-started-title">
      <div className="getting-started-heading">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-100/75">Başlangıç</p>
          <h2 id="getting-started-title" className="mt-1 text-base font-black text-white">ListeKutusu’nu kendine göre ayarla</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="getting-started-count">{completed}/{steps.length}</span>
          <button type="button" onClick={hideForNow} className="getting-started-close" aria-label="Başlangıç rehberini şimdilik gizle" title="Şimdilik gizle"><X size={15} /></button>
        </div>
      </div>
      <div className="getting-started-progress" aria-hidden="true"><span style={{ width: `${completed / steps.length * 100}%` }} /></div>
      <div className="getting-started-steps">
        {steps.map(({ label, done, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            onClick={() => {
              if (href === "#feed-composer") window.dispatchEvent(new Event("feed-composer:open"));
            }}
            className={done ? "getting-started-step getting-started-step-done" : "getting-started-step"}
            aria-label={`${label}${done ? ", tamamlandı" : ""}`}
          >
            <span className="getting-started-step-icon">{done ? <Check size={15} /> : <Icon size={15} />}</span>
            <span>{label}</span>
            {!done && <ChevronRight size={14} className="ml-auto opacity-45" />}
          </Link>
        ))}
      </div>
    </section>
  );
}
