-- ─────────────────────────────────────────────────────────────────────────
-- Migration: 0001_initial_schema
-- Study app — all core tables + RLS policies
-- Spec: /skills/02-backend.md
-- ─────────────────────────────────────────────────────────────────────────

-- Enable pgcrypto extension for gen_random_uuid() (already available in
-- Supabase, but safe to call idempotently).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── roadmaps ─────────────────────────────────────────────────────────────
-- Top-level study track (e.g. "Electronics & Embedded Systems", "C++").
-- current_stage_id / current_topic_id are "resume here" pointers — set
-- by the app when the user marks topics done. FKs are added below after
-- stages and topics tables exist.

CREATE TABLE IF NOT EXISTS roadmaps (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  color            text        NOT NULL,           -- hex code or palette key
  description      text,
  current_stage_id uuid,                           -- FK added below
  current_topic_id uuid,                           -- FK added below
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── stages ───────────────────────────────────────────────────────────────
-- A phase within a roadmap (e.g. "Stage 1: Electronics Fundamentals").
-- Cascades delete so removing a roadmap removes its stages.

CREATE TABLE IF NOT EXISTS stages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id      uuid        NOT NULL REFERENCES roadmaps (id) ON DELETE CASCADE,
  title           text        NOT NULL,
  order_index     int         NOT NULL,
  timeframe_label text,                            -- display-only, e.g. "Week 1–3"
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── topics ───────────────────────────────────────────────────────────────
-- Individual checklist item within a stage (e.g. "Ohm's Law").
-- category is free-form ("theory" / "practical" / anything else).
-- is_done / done_at track completion.

CREATE TABLE IF NOT EXISTS topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id    uuid        NOT NULL REFERENCES stages (id) ON DELETE CASCADE,
  title       text        NOT NULL,
  category    text,                               -- "theory" | "practical" | other
  order_index int         NOT NULL,
  is_done     boolean     NOT NULL DEFAULT false,
  done_at     timestamptz                         -- set when is_done flips to true
);

-- ─── Back-fill FK constraints on roadmaps ─────────────────────────────────
-- These must come AFTER stages and topics tables exist.
-- Fresh migration on a new project — no idempotency wrapper needed.

ALTER TABLE roadmaps
  ADD CONSTRAINT roadmaps_current_stage_id_fkey
    FOREIGN KEY (current_stage_id) REFERENCES stages (id) ON DELETE SET NULL;

ALTER TABLE roadmaps
  ADD CONSTRAINT roadmaps_current_topic_id_fkey
    FOREIGN KEY (current_topic_id) REFERENCES topics (id) ON DELETE SET NULL;

-- ─── log_entries ──────────────────────────────────────────────────────────
-- Record of an actual study session. Drives the streak heatmap and history.
-- stage_id / topic_id are nullable — a session may be logged at roadmap level
-- without drilling down to a specific topic.

CREATE TABLE IF NOT EXISTS log_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id          uuid        NOT NULL REFERENCES roadmaps (id) ON DELETE CASCADE,
  stage_id            uuid        REFERENCES stages (id) ON DELETE SET NULL,
  topic_id            uuid        REFERENCES topics (id) ON DELETE SET NULL,
  date                date        NOT NULL DEFAULT current_date,
  time_spent_minutes  int         NOT NULL,
  commit_link         text,                       -- URL to a commit / PR
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── planned_sessions ─────────────────────────────────────────────────────
-- Calendar planner — intent for a future or current day.
-- Distinct from log_entries (plan ≠ what actually happened).
-- notify_at is reserved for a future notification bot; populate it as
-- (date + start_time) when known so the bot can query it without a migration.

CREATE TABLE IF NOT EXISTS planned_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id  uuid        NOT NULL REFERENCES roadmaps (id) ON DELETE CASCADE,
  stage_id    uuid        REFERENCES stages (id) ON DELETE SET NULL,
  topic_id    uuid        REFERENCES topics (id) ON DELETE SET NULL,
  date        date        NOT NULL,
  start_time  time,                               -- shown in calendar hover
  end_time    time,
  is_complete boolean     NOT NULL DEFAULT false,
  notify_at   timestamptz,                        -- reserved — future notification bot
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
-- Optimise the most common query patterns (streak heatmap, calendar, history).

CREATE INDEX IF NOT EXISTS log_entries_date_idx
  ON log_entries (date DESC);

CREATE INDEX IF NOT EXISTS log_entries_roadmap_date_idx
  ON log_entries (roadmap_id, date DESC);

CREATE INDEX IF NOT EXISTS planned_sessions_date_idx
  ON planned_sessions (date);

CREATE INDEX IF NOT EXISTS planned_sessions_notify_at_idx
  ON planned_sessions (notify_at)
  WHERE notify_at IS NOT NULL;  -- partial index; only future-bot rows matter

CREATE INDEX IF NOT EXISTS topics_stage_id_idx
  ON topics (stage_id, order_index);

CREATE INDEX IF NOT EXISTS stages_roadmap_id_idx
  ON stages (roadmap_id, order_index);

-- ─── Row Level Security ───────────────────────────────────────────────────
-- Single-user personal tool: enable RLS on every table (documents intent)
-- but grant full SELECT/INSERT/UPDATE/DELETE to the anon role via explicit
-- permissive policies. No auth, no multi-tenant isolation needed.

ALTER TABLE roadmaps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_sessions ENABLE ROW LEVEL SECURITY;

-- No IF NOT EXISTS on CREATE POLICY (not valid Postgres syntax).
CREATE POLICY "anon_all_roadmaps"
  ON roadmaps FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_stages"
  ON stages FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_topics"
  ON topics FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_log_entries"
  ON log_entries FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_planned_sessions"
  ON planned_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
