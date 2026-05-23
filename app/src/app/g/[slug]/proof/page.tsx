import { notFound } from "next/navigation";
import { getGoalBySlug } from "@/lib/db";
import ProofUploader from "@/components/ProofUploader";

export default async function ProofPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const goal = await getGoalBySlug(slug);
  if (!goal) notFound();

  if (goal.status === "won" || goal.status === "lost") {
    return (
      <main>
        <h1 className="text-2xl font-bold">This pact is already settled.</h1>
        <a
          className="mt-4 inline-block text-[--color-pact-dark] underline"
          href={`/g/${slug}`}
        >
          Back to pact →
        </a>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          Proof for
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {goal.title}
        </h1>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          The judge will check for
        </h2>
        <p className="text-neutral-800">{goal.proof_prompt}</p>
      </div>

      <ProofUploader slug={goal.slug} attemptsLeft={3 - goal.attempts} />
    </main>
  );
}
