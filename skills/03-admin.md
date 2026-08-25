# Admin — Roadmap Template & Management

## Why a template

Every roadmap added to the system — electronics, C++, or anything future
— must follow the same shape so the rest of the app (progress bars,
"resume here", calendar dots, theory/practical split) can work generically
without per-roadmap special-casing.

## The template

A roadmap is:

```
Roadmap
  - name
  - color
  - description (optional)
  - Stages[] (ordered)
      - title
      - timeframe_label (optional, display only, e.g. "Week 1–3")
      - Topics[] (ordered)
          - title
          - category ("theory" | "practical" | other free-form label,
            optional)
```

This maps directly to the `roadmaps` / `stages` / `topics` tables in
`02-backend.md`. When adding a new roadmap through the admin UI, the form
should walk the user through this exact structure: roadmap details first,
then add stages, then add topics under each stage.

## Admin UI (`/admin`)

Build a page that supports:

- **List existing roadmaps** with edit/delete actions.
- **Add roadmap**: name, color picker (or palette selection), optional
  description.
- **Edit roadmap**: manage its stages —
  - add a stage (title, optional timeframe label)
  - reorder stages (drag-and-drop or up/down controls — either is fine)
  - delete a stage (should also remove its topics — cascade, matches DB
    `on delete cascade`)
  - within a stage, add/edit/delete/reorder topics (title, optional
    category)
- **Delete roadmap**: should warn before deleting, since it cascades to
  all its stages, topics, and log entries.

## Bulk import (nice-to-have, not required for Stage 2)

If time allows, support pasting a structured block of text (matching the
template above) to create a whole roadmap's stages/topics at once,
rather than clicking through the UI one topic at a time — this is how the
electronics roadmap in `06-roadmap-electronics.md` will realistically get
entered. If this isn't built, entering it manually through the UI is
acceptable for Stage 2; bulk import can be added later.

## Seeding

Once the admin CRUD works, use it (via the UI or a one-off seed script
that calls the same logic) to load the roadmap defined in
`06-roadmap-electronics.md` as the first real roadmap in the system.
