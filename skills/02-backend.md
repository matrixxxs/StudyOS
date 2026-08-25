# Backend — Supabase

## Access

The user has already created a Supabase project. You will be given the
**project ref ID** (or, if an MCP/CLI connection is already configured in
this environment, you may already have direct access). Use the Supabase
CLI (`supabase link`, `supabase migration new`, `supabase db push`) or
the configured MCP connector to create and apply migrations — do not ask
the user to hand-run raw SQL in the dashboard unless something fails and
you need them to unblock you.

Do not request or use the `service_role` key. All schema/migration work
should go through your authenticated CLI/MCP session, not through a key
embedded anywhere in the repo.

## Tables

### `roadmaps`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK, default gen_random_uuid() | |
| name | text, not null | e.g. "Electronics & Embedded Systems" |
| color | text, not null | hex code or palette key, used for calendar dots |
| description | text | optional short blurb |
| current_stage_id | uuid, nullable, FK → stages.id | "resume here" pointer |
| current_topic_id | uuid, nullable, FK → topics.id | "resume here" pointer |
| created_at | timestamptz, default now() | |

### `stages`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| roadmap_id | uuid, not null, FK → roadmaps.id, on delete cascade | |
| title | text, not null | e.g. "Stage 1: Electronics Fundamentals" |
| order_index | int, not null | for ordering stages within a roadmap |
| timeframe_label | text | optional, e.g. "Week 1–3" (display only) |
| created_at | timestamptz, default now() | |

### `topics`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| stage_id | uuid, not null, FK → stages.id, on delete cascade | |
| title | text, not null | e.g. "Ohm's Law" |
| category | text | free-form, e.g. "theory" / "practical" — used for
  the theory/practical split shown in "Today's Focus" and calendar dot
  coloring within a roadmap, if the roadmap uses that split |
| order_index | int, not null | |
| is_done | boolean, not null, default false | |
| done_at | timestamptz, nullable | set when marked done |

### `log_entries`

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| roadmap_id | uuid, not null, FK → roadmaps.id | |
| stage_id | uuid, nullable, FK → stages.id | |
| topic_id | uuid, nullable, FK → topics.id | |
| date | date, not null, default current_date | the day this entry counts
  toward for the streak heatmap |
| time_spent_minutes | int, not null | |
| commit_link | text, nullable | URL |
| note | text, nullable | free-text on what was learned/built |
| created_at | timestamptz, default now() | |

### `planned_sessions`

Supports the calendar planner — a plan for a future or current day,
separate from what actually happened (`log_entries`).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| roadmap_id | uuid, not null, FK → roadmaps.id | |
| stage_id | uuid, nullable, FK → stages.id | |
| topic_id | uuid, nullable, FK → topics.id | which topic they intend to
  study — this is the calendar's "task/tick" selection |
| date | date, not null | |
| start_time | time, nullable | shown on hover |
| end_time | time, nullable | shown on hover |
| is_complete | boolean, not null, default false | can be ticked off;
  does not itself create a log entry, they're separate actions |
| notify_at | timestamptz, nullable | **not used yet** — reserved for the
  future notification bot. Populate it (start date + start_time
  combined) even though nothing reads it yet, so the bot can be added
  later without a schema change. |
| created_at | timestamptz, default now() | |

## Row Level Security

Since there's no auth, RLS should be set to **allow all operations
(select/insert/update/delete) to the `anon` role** on every table above.
This is a personal single-user tool, not a public multi-tenant product —
open policies are appropriate here, but still enable RLS on each table
(rather than disabling it) and add an explicit permissive policy, so the
intent is documented in the schema rather than left implicit.

## Derived/computed data (no extra tables needed)

- **Streak / heatmap**: derive from `log_entries.date` — group by date,
  a day counts as "active" if it has ≥1 log entry (for any roadmap, or
  filtered to one roadmap on the roadmap detail page).
- **Current streak / longest streak**: compute from consecutive active
  dates in `log_entries`, don't store as a separate counter — the log
  data is the source of truth.
- **% complete per roadmap**: `topics.is_done` count / total topics for
  that roadmap's stages.
