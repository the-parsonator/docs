"use client";

import { useRecentFoods } from "@/hooks/useRecentFoods";

type Props = {
  onSelect: (name: string, calories: number) => void;
};

export function RecentFoods({ onSelect }: Props) {
  const { data } = useRecentFoods();
  const foods = data?.slice(0, 5) ?? [];

  if (foods.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
      {foods.map((food) => (
        <button
          key={food.name}
          onClick={() => onSelect(food.name, food.calories)}
          className="flex-shrink-0 border border-gray-200 rounded-full px-3 min-h-[36px] text-sm text-gray-600 whitespace-nowrap"
        >
          {food.name}
        </button>
      ))}
    </div>
  );
}
