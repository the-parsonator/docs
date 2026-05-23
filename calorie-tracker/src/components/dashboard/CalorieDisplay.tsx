"use client";

import { TargetEditor } from "./TargetEditor";

type Props = {
  target: number;
  consumed: number;
  isFirstDay?: boolean;
};

export function CalorieDisplay({ target, consumed, isFirstDay = false }: Props) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const pct = Math.min((consumed / target) * 100, 100);

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div
        className="text-8xl font-bold tabular-nums leading-none"
        style={{ color: isOver ? "#dc2626" : "#16a34a" }}
      >
        {Math.abs(remaining).toLocaleString()}
      </div>
      {isOver && (
        <div className="text-red-600 text-sm mt-1 tabular-nums">
          +{Math.abs(remaining).toLocaleString()} kcal
        </div>
      )}
      <div className="text-gray-400 text-xs mt-1">remaining</div>
      <div className="w-full max-w-xs mt-4">
        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: isOver ? "#dc2626" : "#16a34a",
            }}
          />
        </div>
      </div>
      <div className="text-gray-400 text-xs mt-2">
        <span className="tabular-nums">{consumed.toLocaleString()}</span>
        {" "}
        <TargetEditor target={target} isFirstDay={isFirstDay} />
      </div>
    </div>
  );
}
