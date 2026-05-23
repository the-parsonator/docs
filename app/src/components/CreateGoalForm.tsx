"use client";

import { useState } from "react";
import PaymentForm from "./PaymentForm";

export default function CreateGoalForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<{
    clientSecret: string;
    slug: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      title: String(form.get("title") || ""),
      proof_prompt: String(form.get("proof_prompt") || ""),
      owner_email: String(form.get("owner_email") || ""),
      deadline: String(form.get("deadline") || ""),
      stake_pounds: Number(form.get("stake_pounds") || 0),
      accept_terms: form.get("accept_terms") === "on",
      waive_cooling_off: form.get("waive_cooling_off") === "on",
    };
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setSubmitting(false);
      return;
    }
    if (data.clientSecret) {
      setSecret({ clientSecret: data.clientSecret, slug: data.slug });
      setSubmitting(false);
    } else {
      // Dev mode without Stripe keys — goal is already active.
      window.location.href = `/g/${data.slug}`;
    }
  }

  if (secret) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-[--color-pact]/10 px-3 py-2 text-sm text-[--color-pact-dark]">
          Pact drafted. Add a card to seal it.
        </div>
        <PaymentForm clientSecret={secret.clientSecret} slug={secret.slug} />
      </div>
    );
  }

  const today = new Date();
  const minDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">What pact are you making?</label>
        <input
          name="title"
          required
          maxLength={120}
          className="input"
          placeholder="Run a 5K under 30 minutes"
        />
      </div>
      <div>
        <label className="label">
          What will a photo of you doing it look like?
        </label>
        <textarea
          name="proof_prompt"
          required
          maxLength={500}
          rows={3}
          className="input"
          placeholder="A selfie of me at the finish line, sweating, with my running watch showing a 5K distance and a time under 30:00."
        />
        <p className="mt-1 text-xs text-neutral-500">
          This is what the AI judge compares your photo against. Be specific.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Deadline</label>
          <input
            name="deadline"
            type="date"
            required
            min={minDate}
            className="input"
          />
        </div>
        <div>
          <label className="label">Stake (£)</label>
          <input
            name="stake_pounds"
            type="number"
            required
            min={10}
            max={500}
            step={5}
            defaultValue={50}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">Your email</label>
        <input
          name="owner_email"
          type="email"
          required
          className="input"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2 rounded-md bg-neutral-50 p-3 text-sm">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="accept_terms"
            required
            className="mt-0.5"
          />
          <span>
            I authorise a charge of my chosen stake if I break the pact — my
            proof is rejected, or not submitted by the deadline + 24h grace.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="waive_cooling_off"
            required
            className="mt-0.5"
          />
          <span>
            I want this goal to start immediately and I understand I waive my
            14-day right to cancel.
          </span>
        </label>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full text-base"
      >
        {submitting ? "Sealing pact…" : "Seal the pact & add card →"}
      </button>
    </form>
  );
}
