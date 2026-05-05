"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAddFoodEntry } from "@/hooks/useDailyLog";

const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => m.BarcodeScanner),
  { ssr: false }
);

const PhotoLogger = dynamic(
  () => import("./PhotoLogger").then((m) => m.PhotoLogger),
  { ssr: false }
);

type Props = {
  initialName?: string;
  initialCalories?: string;
};

export function FoodLogger({ initialName = "", initialCalories = "" }: Props) {
  const addMutation = useAddFoodEntry();
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState(initialCalories);
  const [showScanner, setShowScanner] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [error, setError] = useState("");

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    try {
      const res = await fetch(`/api/food-search?barcode=${barcode}`);
      const data = await res.json();
      if (data.found) {
        setName(data.name);
        setCalories(String(data.calories));
      } else {
        setError("Not found");
      }
    } catch {
      setError("No connection.");
    }
  }, []);

  const handlePhotoResult = useCallback(
    (result: { found: boolean; name?: string; calories?: number }) => {
      if (result.found && result.name && result.calories !== undefined) {
        setName(result.name);
        setCalories(String(result.calories));
      } else {
        setError("Not food.");
      }
    },
    []
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cal = parseInt(calories, 10);
    if (!name.trim() || isNaN(cal) || cal <= 0) {
      setError("Check your input.");
      return;
    }
    try {
      await addMutation.mutateAsync({ name: name.trim(), calories: cal });
      setName("");
      setCalories("");
    } catch {
      setError("Failed.");
    }
  }

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showPhoto && (
        <PhotoLogger
          onResult={handlePhotoResult}
          onClose={() => setShowPhoto(false)}
        />
      )}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Food"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border border-gray-200 rounded px-3 min-h-[48px] text-base outline-none focus:border-gray-400 min-w-0"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="kcal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-20 border border-gray-200 rounded px-3 min-h-[48px] text-base outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="bg-gray-900 text-white rounded px-4 min-h-[48px] font-medium disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowScanner(true);
            }}
            className="flex-1 border border-gray-200 rounded min-h-[48px] text-sm text-gray-500"
          >
            Scan
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowPhoto(true);
            }}
            className="flex-1 border border-gray-200 rounded min-h-[48px] text-sm text-gray-500"
          >
            Photo
          </button>
        </div>
      </div>
    </>
  );
}
