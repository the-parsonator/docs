import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/app.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

declare global {
  var __db: Database.Database | undefined;
}

export const db = global.__db ?? new Database(DB_PATH);
if (!global.__db) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  global.__db = db;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id              TEXT PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    proof_prompt    TEXT NOT NULL,
    owner_email     TEXT NOT NULL,
    deadline        TEXT NOT NULL,
    timezone        TEXT NOT NULL DEFAULT 'Europe/London',
    stake_pence     INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'gbp',
    stripe_customer TEXT,
    stripe_setup_intent TEXT,
    stripe_pm       TEXT,
    status          TEXT NOT NULL DEFAULT 'pending_setup',
    proof_path      TEXT,
    proof_verdict   TEXT,
    proof_reason    TEXT,
    attempts        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    charged_at      TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline, status);
`);

// Idempotent column add for older dev DBs created before this column existed.
try {
  db.exec("ALTER TABLE goals ADD COLUMN stripe_setup_intent TEXT");
} catch {
  // already exists
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

export const getGoalBySlug = db.prepare<[string], Goal>(
  "SELECT * FROM goals WHERE slug = ?"
);
export const getGoalById = db.prepare<[string], Goal>(
  "SELECT * FROM goals WHERE id = ?"
);
export const listRecentGoals = db.prepare<[], Goal>(
  "SELECT * FROM goals WHERE status IN ('won','lost') ORDER BY created_at DESC LIMIT 20"
);
