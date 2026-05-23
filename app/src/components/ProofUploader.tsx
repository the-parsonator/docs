"use client";

import { useState } from "react";

type Verdict = {
  verdict: "VERIFIED" | "REJECTED" | "INCONCLUSIVE";
  reason: string;
  attempts_left: number;
  status: string;
};

export default function ProofUploader({
  slug,
  attemptsLeft,
}: {
  slug: string;
  attemptsLeft: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`/api/goals/${slug}/proof`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed");
      setSubmitting(false);
      return;
    }
    setResult(data);
    setSubmitting(false);
  }

  if (attemptsLeft <= 0) {
    return (
      <div className="card text-center">
        <p>No attempts remaining. Your stake will be charged.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="label">Upload your proof selfie</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onFile}
          className="block w-full text-sm"
        />
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="mt-4 max-h-96 w-full rounded-md object-contain"
          />
        )}
        <p className="mt-3 text-xs text-neutral-500">
          Attempts left: {attemptsLeft} / 3. After 3 rejections your card is
          charged.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`card border-2 ${
            result.verdict === "VERIFIED"
              ? "border-[--color-pact]"
              : result.verdict === "REJECTED"
                ? "border-[--color-burn]"
                : "border-amber-400"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide">
            Judge says: {result.verdict}
          </p>
          <p className="mt-2 text-neutral-800">{result.reason}</p>
          {result.verdict === "VERIFIED" && (
            <p className="mt-3 text-sm text-[--color-pact-dark]">
              Pact kept. No charge.
            </p>
          )}
          {result.verdict !== "VERIFIED" && (
            <p className="mt-3 text-sm text-neutral-600">
              Attempts left: {result.attempts_left}
            </p>
          )}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!file || submitting}
        className="btn btn-primary w-full text-base disabled:opacity-50"
      >
        {submitting ? "Judging…" : "Submit proof"}
      </button>
    </div>
  );
}
