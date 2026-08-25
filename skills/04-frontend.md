# Frontend — Pages & Behavior

All pages share a persistent sidebar nav (see `05-frontend-design.md` for
the visual layout): Dashboard, Calendar, Log, History, Admin.

## `/` — Dashboard

- Lists all roadmaps as cards, each showing: name, color accent, %
  complete progress bar, current stage/topic ("you're on Stage 4:
  C/C++").
- Overall stats across all roadmaps: total days logged, current streak,
  longest streak (see `02-backend.md` for how these are derived).
- A combined GitHub-style dot heatmap (all roadmaps' log entries
  together) — this is the primary "consistency" visual, matching the
  reference screenshot's "Daily GitHub Streak Dot Map".
- "Today's Focus" section: pulls today's `planned_sessions` (if any) and
  shows them as a checklist, split by category if the topics have
  theory/practical categories (matches reference image's Theory
  Mastery / Practical Lab split). Clicking a session's topic can open the
  log form pre-filled for that roadmap/stage/topic.
- Clicking a roadmap card goes to `/roadmap/[id]`.

## `/roadmap/[id]` — Roadmap detail

- This roadmap's own progress: % complete, per-stage completion
  breakdown, a graph of time spent or topics completed over time (simple
  line or bar chart is fine — this is the "analytics" view requested).
- This roadmap's own dot heatmap (log entries filtered to this
  roadmap_id) and streak, using this roadmap's color.
- Current stage/topic ("resume here") shown prominently.
- List of stages with their topics and done/not-done state — this list
  should also be where topics can be marked done directly (which advances
  the roadmap's `current_stage_id`/`current_topic_id`).

## `/log` — Log entry form

Fields, per `02-backend.md`'s `log_entries` table:
- Date (defaults to today)
- Roadmap (select)
- Stage (select, filtered to the chosen roadmap)
- Topic (select, filtered to the chosen stage) — optional but
  recommended
- Time spent (number input; minutes)
- Commit link (URL input, optional)
- Note (textarea) — what was learned/built

On submit: insert into `log_entries`. If a topic was selected and the
user indicates it's complete, offer a checkbox to also mark that topic
`is_done = true` (updates `topics` and the roadmap's resume pointer) —
don't force this, since one log entry doesn't always mean a topic is
finished.

## `/history` — Log history

- Table/list of all `log_entries`, most recent first.
- Columns: date, roadmap (color-coded), stage/topic, time spent, note
  (truncated, expandable), commit link.
- Filterable by roadmap and by stage/topic.
- Support edit and delete on each row.

## `/calendar` — Calendar planner

- Month view (matches reference image layout: grid of days, dots on days
  with activity or plans).
- Each day can show up to a few colored dots — color = roadmap color,
  matching the roadmap that has a planned session or log entry on that
  day.
- **Past/present days**: dots reflect actual `log_entries` for that date
  (what really happened).
- **Future days**: dots reflect `planned_sessions` for that date (what's
  planned). This is the "past shows actual, future shows planned" split.
- **Hover a day**: show a small popover/tooltip with that day's planned
  session(s) — roadmap, topic, start time, end time. If it's a past day
  with log entries, show what was actually logged instead.
- **Click a day** (especially a future day): open a small form to
  create/edit a planned session for that day — roadmap, topic (the
  "task/tick" selection), start time, end time.
- Today should be visually distinguished (e.g. outlined), matching the
  reference image.

## `/admin` — see `03-admin.md`
