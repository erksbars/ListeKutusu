"use client";

import { Award, Check, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AchievementItem = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  progress: number;
  unlocked: boolean;
};

type AchievementData = {
  userId: string;
  unlocked: AchievementItem[];
  next: AchievementItem | null;
  unlockedCount: number;
  totalCount: number;
};

type AchievementProgressProps = {
  onMessage: (message: string) => void;
};

export function AchievementProgress({ onMessage }: AchievementProgressProps) {
  const [data, setData] = useState<AchievementData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/achievements", { cache: "no-store" });
    const nextData = await res.json().catch(() => null);
    if (!res.ok || !nextData?.userId) return;

    const storageKey = `listekutusu_achievements_${nextData.userId}`;
    const unlockedIds = (nextData.unlocked as AchievementItem[]).map((item) => item.id);
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue) {
        const stored = JSON.parse(storedValue) as string[];
        const newAchievement = (nextData.unlocked as AchievementItem[]).find(
          (item) => !stored.includes(item.id)
        );
        if (newAchievement) onMessage(`Yeni başarım: ${newAchievement.title}`);
      }
      window.localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
    } catch {
      // Başarım görünümü depolama kapalıyken de çalışır.
    }
    setData(nextData);
  }, [onMessage]);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    const onRefresh = () => void load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("achievement:refresh", onRefresh);
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("achievement:refresh", onRefresh);
      window.clearInterval(timer);
    };
  }, [load]);

  if (!data) return null;

  return (
    <section className="achievement-progress" aria-label="Başarım ilerlemesi">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="achievement-progress-icon"><Award size={16} /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100/75">Başarımlar</p>
            <p className="text-sm font-black text-white">{data.unlockedCount}/{data.totalCount} açıldı</p>
          </div>
        </div>
        {data.next ? <Target size={17} className="text-cyan-200/78" /> : <Check size={17} className="text-emerald-300" />}
      </div>
      {data.next ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-bold text-cyan-50/76">{data.next.title}</span>
            <span className="shrink-0 font-black text-cyan-100">{data.next.current}/{data.next.target}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${data.next.progress}%` }} />
          </div>
          <p className="mt-2 text-xs leading-4 text-cyan-50/72">{data.next.description}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-emerald-200/75">Tüm mevcut başarımlar açıldı.</p>
      )}
    </section>
  );
}
