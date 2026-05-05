"use client";

import { useDailyLog } from "@/hooks/useDailyLog";
import { CalorieDisplay } from "./CalorieDisplay";
import { FoodList } from "./FoodList";
import { FoodLogger } from "./FoodLogger";

export function DashboardClient() {
  const { data, isLoading, isError } = useDailyLog();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-pulse">
          <div className="h-20 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-1 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-24 border-t border-gray-100 bg-white" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Failed.</p>
      </div>
    );
  }

  const { log } = data;
  const consumed = log.foodEntries.reduce(
    (sum: number, e: { calories: number }) => sum + e.calories,
    0
  );

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-4 min-h-[48px] border-b border-gray-100">
        <span className="text-sm text-gray-400">calorie tracker</span>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="text-sm text-gray-400 min-h-[48px] min-w-[48px]"
        >
          Log out
        </button>
      </header>
      <CalorieDisplay target={log.calorieTarget} consumed={consumed} />
      <FoodList entries={log.foodEntries} />
      <FoodLogger />
    </div>
  );
}
