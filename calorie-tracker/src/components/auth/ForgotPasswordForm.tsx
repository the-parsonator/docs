"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed.");
        return;
      }
      setSent(true);
    } catch {
      setError("No connection.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6">Check your email.</h1>
        <p className="text-sm text-gray-500 mb-6">
          A reset link has been sent if the address is registered. The link expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="block text-sm text-gray-400 underline text-center min-h-[48px] leading-[48px]"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-xl font-semibold mb-6">Reset password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-200 rounded px-3 min-h-[48px] text-base outline-none focus:border-gray-400"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded min-h-[48px] font-medium disabled:opacity-50"
        >
          Send link
        </button>
      </form>
      <Link
        href="/login"
        className="block mt-4 text-sm text-gray-400 underline text-center min-h-[48px] leading-[48px]"
      >
        Back to log in
      </Link>
    </div>
  );
}
