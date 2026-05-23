import type { GoalStatus } from "@/lib/db";

const styles: Record<GoalStatus, string> = {
  pending_setup: "bg-neutral-200 text-neutral-700",
  active: "bg-amber-100 text-amber-800",
  awaiting_proof: "bg-blue-100 text-blue-800",
  won: "bg-[--color-pact]/15 text-[--color-pact-dark]",
  lost: "bg-[--color-burn]/15 text-[--color-burn]",
  refunded: "bg-neutral-200 text-neutral-700",
};

const labels: Record<GoalStatus, string> = {
  pending_setup: "Awaiting card",
  active: "Active",
  awaiting_proof: "Awaiting proof",
  won: "Kept",
  lost: "Broken",
  refunded: "Refunded",
};

export default function StatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
