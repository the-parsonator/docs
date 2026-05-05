"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  target: number;
  isFirstDay: boolean;
};

export function TargetEditor({ target, isFirstDay }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(target));
  const [hintDismissed, setHintDismissed] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  async function commit() {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0 && n <= 10000 && n !== target) {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calorieTarget: n }),
      });
      await queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    } else {
      setValue(String(target));
    }
    setEditing(false);
    setHintDismissed(true);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setValue(String(target)); setEditing(false); }
        }}
        autoFocus
        className="w-20 text-xs text-gray-400 tabular-nums text-center border-b border-gray-300 outline-none"
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 10); }}
        className="text-xs text-gray-400 tabular-nums underline-offset-2 hover:underline"
      >
        / {target.toLocaleString()} kcal
      </button>
      {isFirstDay && !hintDismissed && (
        <span
          className="text-xs text-gray-300 mt-1 cursor-pointer"
          onClick={() => setHintDismissed(true)}
        >
          Tap to change.
        </span>
      )}
    </div>
  );
}
