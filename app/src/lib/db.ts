import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

declare global {
  var __supabase: SupabaseClient | undefined;
}

export const supabase: SupabaseClient | null =
  global.__supabase ??
  (url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null);

if (supabase && !global.__supabase) {
  global.__supabase = supabase;
}

export const supabaseConfigured = () => supabase !== null;

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return supabase;
}

export type GoalStatus =
  | "pending_setup"
  | "active"
  | "awaiting_proof"
  | "won"
  | "lost"
  | "refunded";

export type Goal = {
  id: string;
  slug: string;
  title: string;
  proof_prompt: string;
  owner_email: string;
  deadline: string;
  timezone: string;
  stake_pence: number;
  currency: string;
  stripe_customer: string | null;
  stripe_setup_intent: string | null;
  stripe_pm: string | null;
  status: GoalStatus;
  proof_path: string | null;
  proof_verdict: string | null;
  proof_reason: string | null;
  attempts: number;
  created_at: string;
  charged_at: string | null;
};

export type NewGoal = {
  id: string;
  slug: string;
  title: string;
  proof_prompt: string;
  owner_email: string;
  deadline: string;
  stake_pence: number;
  stripe_customer: string | null;
  stripe_setup_intent: string | null;
  status: GoalStatus;
};

export async function getGoalBySlug(slug: string): Promise<Goal | null> {
  const { data, error } = await requireClient()
    .from("goals")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Goal | null) ?? null;
}

export async function listRecentGoals(): Promise<Goal[]> {
  if (!supabase) return []; // landing page renders fine without DB
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .in("status", ["won", "lost"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data as Goal[] | null) ?? [];
}

export async function insertGoal(g: NewGoal): Promise<void> {
  const { error } = await requireClient().from("goals").insert(g);
  if (error) throw error;
}

export async function activateGoalBySlug(args: {
  slug: string;
  paymentMethod: string;
}): Promise<Goal | null> {
  const { data, error } = await requireClient()
    .from("goals")
    .update({ stripe_pm: args.paymentMethod, status: "active" })
    .eq("slug", args.slug)
    .eq("status", "pending_setup")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as Goal | null) ?? null;
}

export async function activateGoalById(args: {
  id: string;
  paymentMethod: string;
}): Promise<void> {
  const { error } = await requireClient()
    .from("goals")
    .update({ stripe_pm: args.paymentMethod, status: "active" })
    .eq("id", args.id)
    .eq("status", "pending_setup");
  if (error) throw error;
}

export async function recordProofAttempt(args: {
  slug: string;
  proofPath: string;
  verdict: string;
  reason: string;
  newStatus: GoalStatus;
  attempts: number;
  chargedAt: string | null;
}): Promise<void> {
  const patch: Record<string, unknown> = {
    proof_path: args.proofPath,
    proof_verdict: args.verdict,
    proof_reason: args.reason,
    status: args.newStatus,
    attempts: args.attempts,
  };
  if (args.chargedAt) patch.charged_at = args.chargedAt;

  const { error } = await requireClient()
    .from("goals")
    .update(patch)
    .eq("slug", args.slug);
  if (error) throw error;
}

export async function findDueGoals(): Promise<Goal[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await requireClient()
    .from("goals")
    .select("*")
    .eq("status", "active")
    .lte("deadline", today);
  if (error) throw error;
  return (data as Goal[] | null) ?? [];
}

export async function markAwaitingProof(id: string): Promise<void> {
  const { error } = await requireClient()
    .from("goals")
    .update({ status: "awaiting_proof" })
    .eq("id", id);
  if (error) throw error;
}
