"use client";

import { Check, Flame, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type DailyGoal = {
  id: string;
  label: string;
  current: number;
  target: number;
  progress: number;
  completed: boolean;
};

type DailyGoalData = {
  streak: number;
  goals: DailyGoal[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
};

export function DailyRhythm() {
  const [data, setData] = useState<DailyGoalData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/daily-goals", { cache: "no-store" });
    const next = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok && Array.isArray(next?.goals)) setData(next);
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("daily-goals:refresh", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("daily-goals:refresh", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  if (!data) return null;

  return (
    <section className="daily-rhythm" aria-label="Günlük hedefler">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/75">Günlük ritim</p>
          <h2 className="mt-1 text-lg font-black text-white">{data.completedCount}/{data.totalCount} hedef</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="daily-streak"><Flame size={14} /> {data.streak} gün</span>
          <button type="button" onClick={() => void load()} disabled={loading} className="daily-refresh" aria-label="Günlük hedefleri yenile" title="Yenile">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {data.goals.map((goal) => (
          <div key={goal.id} className={goal.completed ? "daily-goal daily-goal-complete" : "daily-goal"}>
            <span className="daily-goal-check">{goal.completed ? <Check size={13} /> : null}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-cyan-50/82">{goal.label}</span>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${goal.progress}%` }} />
              </span>
            </span>
            <span className="text-xs font-black text-cyan-100/68">{goal.current}/{goal.target}</span>
          </div>
        ))}
      </div>
      {data.allCompleted && <p className="mt-3 text-xs font-bold text-emerald-200">Bugünün ritmi tamamlandı.</p>}
    </section>
  );
}
