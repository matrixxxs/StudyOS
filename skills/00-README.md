# Study — Project Spec (Read Me First)

"Study" is a personal, single-user web app for tracking progress across
multiple self-study roadmaps (starting with an electronics/embedded
roadmap), planning daily study sessions on a calendar, and maintaining a
GitHub-style daily streak.

This folder contains the full spec, split into files so you can read only
what's relevant to the stage you're on. **Read all files before writing
any code**, then build in the stages below — do not build everything at
once.

## Files in this spec

- `01-architecture.md` — tech stack, folder structure, data model, how the
  pieces fit together. Read this first.
- `02-backend.md` — Supabase setup, table schema, RLS policy, how to get
  DB access and apply migrations.
- `03-admin.md` — the roadmap template format, and the admin UI for
  adding/editing/removing roadmaps and stages.
- `04-frontend.md` — pages/routes, what each page does, component
  behavior, state/data flow.
- `05-frontend-design.md` — visual design system: colors, layout, the
  reference screenshots' style, dark theme details.
- `06-roadmap-electronics.md` — the first real roadmap to seed into the
  system, in the template format, sourced from the user's own roadmap
  document.

## Build order (stages)

Work through these stages **one at a time**. After finishing each stage,
stop and give a short report: what was built, what decisions you made,
any assumptions, and what's left. Wait for confirmation before moving to
the next stage.

1. **Stage 1 — Architecture + Supabase schema.** Set up the Next.js
   project structure (if not already scaffolded), connect to Supabase
   using the project ref provided, and write + apply the SQL migration
   files for all tables in `02-backend.md`. No UI yet.
2. **Stage 2 — Admin: roadmap template + CRUD.** Build the admin section
   for creating/editing/removing roadmaps and stages, following the
   template in `03-admin.md`. Seed the database with the electronics
   roadmap from `06-roadmap-electronics.md` using this system.
3. **Stage 3 — Core dashboard + roadmap progress view.** Build the main
   dashboard (multi-roadmap overview) and the per-roadmap detail view
   with progress graph/analytics, per `04-frontend.md`.
4. **Stage 4 — Log entry + history.** Build the daily log form and the
   history list/table.
5. **Stage 5 — Calendar planner.** Build the interactive calendar: plan
   sessions, set start/end time, hover previews, task/tick selection for
   the next day, and the theory/practical (or per-roadmap) color-coded
   dots.
6. **Stage 6 — Visual design pass.** Apply the full dark-theme design
   system from `05-frontend-design.md` across all pages built so far.

**Not in this build** — do not implement yet, but keep the data model
open to it: a future notification bot that messages the user when a
planned study session is about to start. Don't build the bot, but don't
design the schema in a way that would block adding it later (see
`02-backend.md` for the specific fields that exist for this reason).

## Ground rules

- Single user, no authentication/login anywhere in the app.
- Dark mode only — no light theme needed.
- Deploy target is Vercel; keep the app deployable at every stage (no
  broken builds between stages).
- Never write the Supabase `service_role` key into any file in this
  repo. Only the public `anon` key belongs in `.env.local`, and
  `.env.local` must stay out of git (already covered by the default
  Next.js `.gitignore`).
