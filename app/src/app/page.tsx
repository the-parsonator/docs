import { listRecentGoals } from "@/lib/db";
import { formatGBP } from "@/lib/money";
import CreateGoalForm from "@/components/CreateGoalForm";

export default function Home() {
  const recent = listRecentGoals.all();

  return (
    <main>
      <section className="mb-14">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Make a pact with yourself.
          <br />
          <span className="text-[--color-pact]">Prove it with a selfie.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-600">
          Set a deadline. Stake real money. On the day, upload a photo of you
          doing the thing. An AI judge checks it. Break the pact and we charge
          your card.
        </p>
      </section>

      <section className="card mb-14">
        <h2 className="mb-4 text-lg font-semibold">Make a pact</h2>
        <CreateGoalForm />
      </section>

      <section id="how" className="mb-14">
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <ol className="space-y-3 text-neutral-700">
          <li>
            <strong>1. Pact.</strong> Write what you&apos;ll do and what a
            photo of it will look like.
          </li>
          <li>
            <strong>2. Stake.</strong> Pre-authorise £10–£500 with your card.
            Nothing is charged yet.
          </li>
          <li>
            <strong>3. Prove.</strong> On deadline day, upload a selfie. An AI
            judge checks it against your description.
          </li>
          <li>
            <strong>4. Kept or broken.</strong> Verified → no charge. Rejected
            three times → your card is charged.
          </li>
        </ol>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Recently settled</h2>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {recent.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <a
                  href={`/g/${g.slug}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {g.title}
                </a>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-500">
                    {formatGBP(g.stake_pence)}
                  </span>
                  <span
                    className={
                      g.status === "won"
                        ? "rounded bg-[--color-pact]/10 px-2 py-0.5 text-xs font-semibold text-[--color-pact-dark]"
                        : "rounded bg-[--color-burn]/10 px-2 py-0.5 text-xs font-semibold text-[--color-burn]"
                    }
                  >
                    {g.status === "won" ? "kept" : "broken"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
