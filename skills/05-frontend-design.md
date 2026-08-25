# Frontend Design

Reference: the user provided two screenshots of a "Mastery Tracker" app
as the design direction. Match this style and layout, generalized so it
works for any roadmap (the reference happens to show one specific
roadmap called "Web Development").

## Overall theme

- **Dark mode only.** Deep charcoal/near-black background
  (not pure black — something like `#0f1115` to `#14161b` range), with
  card surfaces a shade lighter than the page background so cards read
  as distinct panels.
- Accent color: green (the reference uses a mint/teal-green for the
  active streak dots and progress bar) — use this as the default accent
  for UI chrome (buttons, active nav item, focus states), independent of
  per-roadmap colors used for dots.
- Rounded corners on cards, soft/no harsh borders, subtle shadows or
  faint borders to separate panels rather than heavy dividing lines.
- Clean sans-serif typography, comfortable spacing — avoid a cramped,
  data-dense feel even though there's a lot of information on the
  dashboard.

## Layout

- **Persistent left sidebar** (collapsible on mobile): logo/app name at
  top, then nav items with icons — Dashboard, Calendar, Log, History,
  Admin. Highlight the active route.
- **Top bar** on main content area: page title / current roadmap context,
  optionally a search or quick-action button on the right (matches
  reference's search bar + notification/profile icons — a simplified
  version is fine since there's no multi-user auth).
- **Dashboard layout**: progress summary header (roadmap name, % complete,
  progress bar) → two-column row below with the dot heatmap on the left
  and the calendar/today's-focus content on the right → "Today's Focus"
  split into two columns beneath (Theory / Practical style) → a "Quick
  Log" bar pinned near the bottom, matching the reference's persistent
  quick-add row.
- Reference also shows this dashboard adapted responsively into a
  single-column mobile layout — stack sections vertically, keep the dot
  heatmap and streak numbers near the top since that's the primary
  "did I keep my streak" glance-check.

## Dot heatmap

- Grid of small rounded-square dots, one per day, colored by activity
  level/roadmap color, muted/gray for inactive days — same visual
  language as a GitHub contribution graph.
- Show current streak and longest streak as numbers directly below or
  beside the grid, styled prominently (bold, larger text) since
  consistency is the core motivator of this whole app.

## Calendar

- Standard month grid, days as cells, colored dots inside/below the day
  number for planned or logged sessions (dot color = roadmap color).
- Today's cell outlined/highlighted.
- Hover state shows a lightweight tooltip/popover (not a full modal) with
  session time details.

## Progress bars

- Thin, rounded, filled with the roadmap's own color (not always the
  global green accent) so multiple roadmaps stay visually distinguishable
  on the dashboard.

## General principle

Prioritize legibility and a calm, focused feel over density — this is a
personal daily-use tool, and it should feel encouraging to open, not like
a cluttered analytics dashboard.
