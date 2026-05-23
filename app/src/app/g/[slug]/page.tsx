import { notFound } from "next/navigation";
import { activateGoalBySlug, getGoalBySlug, type Goal } from "@/lib/db";
import { formatGBP } from "@/lib/money";
import { retrieveSetupIntent, stripeConfigured } from "@/lib/stripe";
import StatusBadge from "@/components/StatusBadge";

async function maybeActivateFromStripe(goal: Goal): Promise<Goal> {
  if (!stripeConfigured()) return goal;
  if (goal.status !== "pending_setup") return goal;
  if (!goal.stripe_setup_intent) return goal;
  try {
    const si = await retrieveSetupIntent(goal.stripe_setup_intent);
    if (si.status === "succeeded" && typeof si.payment_method === "string") {
      const updated = await activateGoalBySlug({
        slug: goal.slug,
        paymentMethod: si.payment_method,
      });
      return updated ?? goal;
    }
  } catch {
    // Stripe call failed — fall through; webhook will handle eventually.
  }
  return goal;
}

export default async function GoalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ setup_complete?: string }>;
}) {
  const { slug } = await params;
  const { setup_complete } = await searchParams;
  let goal = await getGoalBySlug(slug);
  if (!goal) notFound();

  if (setup_complete) {
    goal = await maybeActivateFromStripe(goal);
  }

  const deadline = new Date(goal.deadline);
  const now = new Date();
  const daysLeft = Math.ceil(
    (deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
  const canUploadProof =
    goal.status === "active" || goal.status === "awaiting_proof";

  return (
    <main className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Pact
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {goal.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge status={goal.status} />
          <span className="text-neutral-500">
            Stake <strong>{formatGBP(goal.stake_pence)}</strong>
          </span>
          <span className="text-neutral-500">
            Deadline <strong>{goal.deadline}</strong>
            {goal.status === "active" && daysLeft > 0 && (
              <span className="ml-1 text-neutral-400">
                ({daysLeft} day{daysLeft === 1 ? "" : "s"} left)
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Proof description
        </h2>
        <p className="text-neutral-800">{goal.proof_prompt}</p>
      </div>

      {canUploadProof && (
        <a href={`/g/${goal.slug}/proof`} className="btn btn-primary text-base">
          {goal.status === "awaiting_proof"
            ? "Re-upload proof →"
            : "Upload proof →"}
        </a>
      )}

      {goal.proof_verdict && (
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Judge verdict
          </h2>
          <p>
            <strong>{goal.proof_verdict}</strong> — {goal.proof_reason}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Attempts used: {goal.attempts} / 3
          </p>
        </div>
      )}

      <div className="text-xs text-neutral-500">
        Shareable link:{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5">
          /g/{goal.slug}
        </code>
      </div>
    </main>
  );
}
