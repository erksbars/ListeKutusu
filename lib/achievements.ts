export type AchievementMetrics = {
  posts: number;
  likes: number;
  adds: number;
  followers: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  metric: keyof AchievementMetrics;
  current: number;
  target: number;
  progress: number;
  unlocked: boolean;
};

const DEFINITIONS: Array<
  Omit<Achievement, "current" | "progress" | "unlocked">
> = [
  {
    id: "first-share",
    title: "İlk İz",
    description: "Akışta ilk şarkını paylaş.",
    metric: "posts",
    target: 1,
  },
  {
    id: "steady-curator",
    title: "Seçki Ustası",
    description: "Akışta 10 farklı şarkı paylaş.",
    metric: "posts",
    target: 10,
  },
  {
    id: "first-like",
    title: "İlk Alkış",
    description: "Paylaşımlarında ilk beğenini kazan.",
    metric: "likes",
    target: 1,
  },
  {
    id: "crowd-favorite",
    title: "Kulakların Favorisi",
    description: "Paylaşımlarında toplam 25 beğeni kazan.",
    metric: "likes",
    target: 25,
  },
  {
    id: "first-add",
    title: "Listeye Girdi",
    description: "Bir keşfin başka bir kullanıcının listesine eklensin.",
    metric: "adds",
    target: 1,
  },
  {
    id: "discovery-effect",
    title: "Keşif Etkisi",
    description: "Keşiflerin toplam 10 kez listelere eklensin.",
    metric: "adds",
    target: 10,
  },
  {
    id: "first-follower",
    title: "İlk Takipçi",
    description: "İlk takipçini kazan.",
    metric: "followers",
    target: 1,
  },
  {
    id: "community-voice",
    title: "Topluluk Sesi",
    description: "10 takipçiye ulaş.",
    metric: "followers",
    target: 10,
  },
];

export function calculateAchievements(metrics: AchievementMetrics) {
  const items: Achievement[] = DEFINITIONS.map((definition) => {
    const current = Math.max(0, metrics[definition.metric] ?? 0);
    return {
      ...definition,
      current,
      progress: Math.min(100, Math.round((current / definition.target) * 100)),
      unlocked: current >= definition.target,
    };
  });
  const unlocked = items.filter((item) => item.unlocked);
  const next = items
    .filter((item) => !item.unlocked)
    .sort((left, right) => right.progress - left.progress || left.target - right.target)[0] ?? null;

  return {
    items,
    unlocked,
    next,
    unlockedCount: unlocked.length,
    totalCount: items.length,
  };
}
