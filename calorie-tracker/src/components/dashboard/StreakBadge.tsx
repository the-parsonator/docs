"use client";

import { useQuery } from "@tanstack/react-query";

type DailyLog = { date: string; foodEntries: { id: number }[] };

function computeStreak(logs: DailyLog[]): number {
  if (!logs.length) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let expected = new Date();
  expected.setDate(expected.getDate() - 1); // history excludes today

  for (const log of sorted) {
    const exp = expected.toISOString().slice(0, 10);
    if (log.date !== exp) break;
    if (log.foodEntries.length > 0) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function StreakBadge() {
  const { data } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetch("/api/history").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const streak = computeStreak(data?.logs ?? []);
  if (streak === 0) return null;

  return (
    <span className="text-xs text-gray-400 tabular-nums">{streak} days</span>
  );
}
