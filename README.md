<div align="center">

# StudyOS

**A personal multi-roadmap study tracker.**

Track your learning progress across structured roadmaps, log study sessions, visualize your streak, and plan upcoming sessions on a calendar — all in a clean, dark-themed dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

<br>

<div align="center">
  <img src="docs/screenshot.png" alt="StudyOS dashboard screenshot" width="800">
  <br>
  <sub>Dashboard view — replace <code>docs/screenshot.png</code> with a real screenshot or GIF</sub>
</div>

<br>

Built for self-directed learners who want more structure than a to-do list but don't need a full LMS.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Status](#status)
- [License](#license)

## Features

|                               |                                                                     |
| ----------------------------- | ------------------------------------------------------------------- |
| 🗺️ **Multi-roadmap tracking** | Organize learning into roadmaps, each broken into stages and topics |
| 📊 **Dashboard**              | At-a-glance view of progress across all active roadmaps             |
| 🔍 **Roadmap detail view**    | Drill into stages and topics, mark progress                         |
| 📝 **Study log & history**    | Log sessions and review past activity                               |
| 🔥 **Streak heatmap**         | GitHub-style dot grid visualizing study consistency over time       |
| 📅 **Calendar planner**       | Schedule upcoming study sessions                                    |
| ⚙️ **Admin panel**            | Create and manage roadmaps, stages, and topics via CRUD             |
| 🌙 **Dark mode**              | Dark theme throughout                                               |
| 🔓 **No auth**                | Single-user, zero-friction setup                                    |

## Tech Stack

| Layer     | Tech                                         |
| --------- | -------------------------------------------- |
| Framework | [Next.js](https://nextjs.org/) (TypeScript)  |
| Styling   | [Tailwind CSS](https://tailwindcss.com/)     |
| Backend   | [Supabase](https://supabase.com/) (Postgres) |
| Hosting   | [Vercel](https://vercel.com/)                |

## Data Model

Core tables: `roadmaps`, `stages`, `topics`, `log_entries`, `planned_sessions`.

Roadmaps contain stages, stages contain topics, and progress is tracked through log entries. `planned_sessions` includes a `notify_at` field reserved for a future notification bot.

## Status

Actively developed. Seeded with a first roadmap (Electronics — 12 stages, 124 topics) as a working example of the roadmap structure.

**Planned next:**

- Seed additional roadmaps
- Notification bot built on `planned_sessions.notify_at`

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
<sub>Built with ☕ and Antigravity</sub>
</div>
