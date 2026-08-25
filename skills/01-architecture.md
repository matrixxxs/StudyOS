# Architecture

## Tech stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database/backend:** Supabase (Postgres + auto-generated REST API via
  `@supabase/supabase-js`)
- **Hosting:** Vercel (public deployment)
- **Auth:** None. Single user, no login. All data is open to the
  anon key, protected only in the sense that it's a low-stakes personal
  tool, not a multi-tenant product.

## Folder structure (App Router)

```
study/
  src/
    app/
      page.tsx                 → Dashboard (all roadmaps overview)
      roadmap/[id]/page.tsx     → Single roadmap detail + progress view
      log/page.tsx              → Daily log entry form
      history/page.tsx          → Log history list/table
      calendar/page.tsx         → Calendar planner
      admin/page.tsx            → Roadmap management (add/edit/remove)
    components/
      ...shared UI components (dot heatmap, streak counter, progress bar,
      calendar grid, roadmap card, log form, etc.)
    lib/
      supabase.ts               → Supabase client init
      types.ts                  → Shared TypeScript types matching the
                                   DB schema
  supabase/
    migrations/                 → SQL migration files (see 02-backend.md)
  .env.local                    → NEXT_PUBLIC_SUPABASE_URL,
                                   NEXT_PUBLIC_SUPABASE_ANON_KEY
                                   (already created by the user — do not
                                   overwrite, do not commit)
```

## High-level data model

Four core entities:

1. **Roadmap** — a top-level study track (e.g. "Electronics & Embedded
   Systems", "C++"). Has a name, a color (used for calendar dots), and a
   template-shaped list of stages.
2. **Stage** — a phase within a roadmap (e.g. "Stage 1: Electronics
   Fundamentals"). Belongs to a roadmap. Contains topics/checklist items.
3. **Topic** — an individual checklist item within a stage (e.g.
   "Ohm's Law", "Kirchhoff's Voltage Law"). Has a done/not-done state.
   This is the granularity used for "resume where I left off."
4. **Log entry** — a record of a study session: which roadmap, which
   stage/topic, how long, a note, and an optional commit link. This
   drives the streak heatmap and history.

A fifth entity, **Planned session**, supports the calendar: a
user-created plan for a future (or today's) date — which roadmap/topic
they intend to study, and a start/end time. This is distinct from a log
entry (a plan is intent; a log entry is what actually happened).

See `02-backend.md` for exact table definitions.

## How "resume where I left off" works

Each roadmap has a `current_stage_id` / `current_topic_id` pointer
(or equivalently, the app derives this from the most recent topic marked
done). When the user opens a roadmap, the UI should immediately surface
"you're on Stage X: Topic Y" without them hunting for it. Marking a topic
done in the roadmap view (or via a log entry) is what advances this
pointer.

## How multi-roadmap works

The dashboard shows all roadmaps as cards/rows with a progress bar and
% complete. Clicking into one goes to `/roadmap/[id]`, which shows that
roadmap's own analytics (progress over time, time spent per stage,
streak specific to that roadmap if desired) — this matches the "Mastery
Study Tracker" reference design, generalized to work for any roadmap, not
just one hardcoded to electronics.

## Color coding

Each roadmap has a `color` field (hex or a fixed palette key). This color
is used consistently: in the roadmap list, in dashboard progress bars,
and as the dot color on the calendar for that roadmap's sessions/logs —
so the user can visually tell roadmaps apart at a glance (e.g.
electronics = green, C++ = blue).
