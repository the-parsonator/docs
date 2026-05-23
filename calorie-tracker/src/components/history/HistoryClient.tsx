"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

type FoodEntry = { id: number; name: string; calories: number };
type DailyLog = {
  id: number;
  date: string;
  calorieTarget: number;
  foodEntries: FoodEntry[];
};

export function HistoryClient() {
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetch("/api/history").then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-48 h-4 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const logs: DailyLog[] = data?.logs ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-4 min-h-[48px] border-b border-gray-100">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 min-h-[48px] flex items-center"
        >
          ← back
        </Link>
        <span className="text-sm font-medium">Log</span>
        <div className="w-12" />
      </header>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No entries.</p>
        ) : (
          logs.map((log) => {
            const consumed = log.foodEntries.reduce(
              (s, e) => s + e.calories,
              0
            );
            const d = new Date(log.date + "T00:00:00");
            const label = d.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            return (
              <div
                key={log.id}
                className="px-4 min-h-[48px] flex items-center justify-between"
              >
                <span className="text-sm">{label}</span>
                <span className="text-sm text-gray-500 tabular-nums">
                  {consumed.toLocaleString()} /{" "}
                  {log.calorieTarget.toLocaleString()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
