-- Pact schema (Supabase Postgres)
-- Run this in the Supabase SQL editor. Idempotent: safe to re-run.

-- Status enum
do $$ begin
  create type goal_status as enum (
    'pending_setup',
    'active',
    'awaiting_proof',
    'won',
    'lost',
    'refunded'
  );
exception when duplicate_object then null; end $$;

-- Goals table
create table if not exists goals (
  id                  text primary key,
  slug                text unique not null,
  title               text not null,
  proof_prompt        text not null,
  owner_email         text not null,
  deadline            date not null,
  timezone            text not null default 'Europe/London',
  stake_pence         integer not null,
  currency            text not null default 'gbp',
  stripe_customer     text,
  stripe_setup_intent text,
  stripe_pm           text,
  status              goal_status not null default 'pending_setup',
  proof_path          text,
  proof_verdict       text,
  proof_reason        text,
  attempts            integer not null default 0,
  created_at          timestamptz not null default now(),
  charged_at          timestamptz
);

create index if not exists idx_goals_deadline on goals (deadline, status);
create index if not exists idx_goals_status on goals (status);

-- Service role bypasses RLS, so RLS is not strictly required for v1
-- (the app only ever queries through the service role key on the server).
-- We still enable RLS as defence-in-depth in case someone exposes anon access.
alter table goals enable row level security;

-- No policies = no rows visible to anon/authenticated. Only service role
-- can read/write. This is what we want until we add user accounts.

-- Storage bucket for proof selfies (private — accessed via signed URLs only)
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;
