export type DailyActivityCounts = {
  shares: number;
  likes: number;
  adds: number;
  follows: number;
};

const GOALS = [
  { id: "share", label: "Bir şarkı paylaş", metric: "shares", target: 1 },
  { id: "like", label: "Üç keşfi beğen", metric: "likes", target: 3 },
  { id: "add", label: "Bir keşfi listene ekle", metric: "adds", target: 1 },
  { id: "follow", label: "Bir müzikseveri takip et", metric: "follows", target: 1 },
] as const;

function istanbulDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function istanbulDayKey(date: Date) {
  const { year, month, day } = istanbulDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function istanbulDayStart(date = new Date()) {
  const { year, month, day } = istanbulDateParts(date);
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export function calculateActivityStreak(activityDates: Date[], now = new Date()) {
  const activeDays = new Set(activityDates.map(istanbulDayKey));
  const todayKey = istanbulDayKey(now);
  const yesterday = new Date(now.getTime() - 86_400_000);
  const startsToday = activeDays.has(todayKey);
  let cursor = startsToday ? now : yesterday;

  if (!startsToday && !activeDays.has(istanbulDayKey(yesterday))) return 0;

  let streak = 0;
  while (activeDays.has(istanbulDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export function buildDailyGoals(counts: DailyActivityCounts) {
  const goals = GOALS.map((goal) => {
    const current = Math.max(0, counts[goal.metric] ?? 0);
    return {
      id: goal.id,
      label: goal.label,
      current,
      target: goal.target,
      progress: Math.min(100, Math.round((current / goal.target) * 100)),
      completed: current >= goal.target,
    };
  });

  return {
    goals,
    completedCount: goals.filter((goal) => goal.completed).length,
    totalCount: goals.length,
    allCompleted: goals.every((goal) => goal.completed),
  };
}
