"use client";

import { useRef, useState } from "react";

type Result = {
  found: boolean;
  name?: string;
  calories?: number;
  scansRemaining?: number;
};

type Props = {
  onResult: (result: Result) => void;
  onClose: () => void;
};

export function PhotoLogger({ onResult, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const base64 = await toBase64(file);
      const res = await fetch("/api/food-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data: Result & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed.");
        return;
      }
      onResult(data);
      onClose();
    } catch {
      setError("No connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">Photo</span>
          <button
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-400 text-xl"
          >
            ×
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded min-h-[48px] font-medium disabled:opacity-50"
        >
          {loading ? "Analysing..." : "Take photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
