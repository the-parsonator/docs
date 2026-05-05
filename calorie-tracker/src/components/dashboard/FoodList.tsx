"use client";

import { useDeleteFoodEntry } from "@/hooks/useDailyLog";

type FoodEntry = {
  id: number;
  name: string;
  calories: number;
};

export function FoodList({ entries }: { entries: FoodEntry[] }) {
  const deleteMutation = useDeleteFoodEntry();

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">No entries.</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center px-4 min-h-[48px]">
          <span className="flex-1 text-sm truncate">{entry.name}</span>
          <span className="text-sm text-gray-500 mr-3 tabular-nums">
            {entry.calories.toLocaleString()}
          </span>
          <button
            onClick={() => deleteMutation.mutate(entry.id)}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-300 hover:text-red-500"
            aria-label="Delete"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
