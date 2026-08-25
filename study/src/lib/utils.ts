// src/lib/utils.ts
// Shared helpers used by dashboard, roadmap detail, and calendar pages.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeatmapCell {
  date: string  // YYYY-MM-DD
  count: number
}

export interface WeeklyBucket {
  weekStart: string // YYYY-MM-DD of the Sunday that starts this week
  label: string     // "12 Jan" etc.
  minutes: number
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Convert a hex color + alpha to an rgba() string. Falls back to accent green. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.startsWith('#') ? hex : '#' + hex
  const full =
    clean.length === 4
      ? '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]
      : clean
  const r = parseInt(full.slice(1, 3), 16)
  const g = parseInt(full.slice(3, 5), 16)
  const b = parseInt(full.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74, 222, 128, ${alpha})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Map activity count → heatmap cell background color. */
export function heatmapCellColor(count: number, color = '#4ade80'): string {
  if (count === 0) return 'rgba(255,255,255,0.05)'
  if (count === 1) return hexToRgba(color, 0.28)
  if (count <= 3) return hexToRgba(color, 0.55)
  if (count <= 6) return hexToRgba(color, 0.80)
  return color
}

// ─── Heatmap builder ──────────────────────────────────────────────────────────

/**
 * Build an ordered array of HeatmapCells covering the past ~52 weeks.
 * @param dates Array of "YYYY-MM-DD" strings (duplicates = multiple sessions)
 */
export function buildHeatmapCells(dates: string[]): HeatmapCell[] {
  const counts: Record<string, number> = {}
  for (const d of dates) counts[d] = (counts[d] ?? 0) + 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start on the Sunday 52 full weeks ago
  const start = new Date(today)
  start.setDate(start.getDate() - 52 * 7 - start.getDay())

  const cells: HeatmapCell[] = []
  const cur = new Date(start)
  while (cur <= today) {
    const d = cur.toISOString().slice(0, 10)
    cells.push({ date: d, count: counts[d] ?? 0 })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
}

// ─── Streak calculator ────────────────────────────────────────────────────────

export function computeStreak(dates: string[]): { current: number; longest: number } {
  if (!dates.length) return { current: 0, longest: 0 }

  const uniqueSorted = [...new Set(dates)].sort()
  const dateSet = new Set(uniqueSorted)

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const todayStr = todayDate.toISOString().slice(0, 10)

  const yestDate = new Date(todayDate)
  yestDate.setDate(yestDate.getDate() - 1)
  const yestStr = yestDate.toISOString().slice(0, 10)

  // Current streak: walk backwards from today (or yesterday if no entry today)
  let current = 0
  const startDate = dateSet.has(todayStr)
    ? new Date(todayDate)
    : dateSet.has(yestStr)
    ? new Date(yestDate)
    : null

  if (startDate) {
    const walkDate = new Date(startDate)
    while (dateSet.has(walkDate.toISOString().slice(0, 10))) {
      current++
      walkDate.setDate(walkDate.getDate() - 1)
    }
  }

  // Longest streak: scan all sorted unique dates
  let best = current === 0 ? 0 : 1
  let run = 1
  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1])
    prev.setDate(prev.getDate() + 1)
    if (prev.toISOString().slice(0, 10) === uniqueSorted[i]) {
      run++
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }

  return { current, longest: Math.max(current, best) }
}

// ─── Bar chart bucketing ──────────────────────────────────────────────────────

/**
 * Group log entries into weekly buckets (Sunday-start).
 * @param entries Array of { date: string; time_spent_minutes: number }
 * @param numWeeks How many weeks back to include (default 12)
 */
export function computeWeeklyBuckets(
  entries: { date: string; time_spent_minutes: number }[],
  numWeeks = 12
): WeeklyBucket[] {
  const buckets: WeeklyBucket[] = []

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = numWeeks - 1; i >= 0; i--) {
    // Sunday of (current week - i)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const minutes = entries
      .filter(e => {
        const d = new Date(e.date)
        return d >= weekStart && d <= weekEnd
      })
      .reduce((sum, e) => sum + (e.time_spent_minutes ?? 0), 0)

    buckets.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      minutes,
    })
  }

  return buckets
}

// ─── Date formatting helpers ──────────────────────────────────────────────────

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtRelative(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return fmtDate(isoStr)
}

export function fmtMinutes(min: number): string {
  if (min <= 0) return '0m'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
