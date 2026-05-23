"use client";

import { useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function PaymentForm({
  clientSecret,
  slug,
}: {
  clientSecret: string;
  slug: string;
}) {
  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (pk ? loadStripe(pk) : null),
    []
  );

  if (!stripePromise) {
    return (
      <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set — cannot mount card form.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#16a34a",
            borderRadius: "6px",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        },
      }}
    >
      <Inner slug={slug} />
    </Elements>
  );
}

function Inner({ slug }: { slug: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/g/${slug}?setup_complete=1`,
      },
    });

    // confirmSetup only returns when there's an error OR the SetupIntent
    // doesn't require redirect — on the success path Stripe redirects to
    // return_url, so this code only runs on failure.
    if (stripeError) {
      setError(stripeError.message ?? "Card could not be saved");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn btn-primary w-full text-base disabled:opacity-50"
      >
        {submitting ? "Saving card…" : "Seal the pact"}
      </button>
      <p className="text-xs text-neutral-500">
        Your card is saved for later. Nothing is charged unless you break the
        pact.
      </p>
    </form>
  );
}
