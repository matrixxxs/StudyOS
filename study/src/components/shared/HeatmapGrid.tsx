'use client'

import { heatmapCellColor, type HeatmapCell } from '@/lib/utils'

interface HeatmapGridProps {
  cells: HeatmapCell[]
  color?: string
  showMonthLabels?: boolean
}

const CELL = 11
const GAP  = 2

export default function HeatmapGrid({
  cells,
  color = '#4ade80',
  showMonthLabels = true,
}: HeatmapGridProps) {
  // Group flat cell array into week columns
  const weeks: HeatmapCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, Math.min(i + 7, cells.length)))
  }

  // Compute month label positions (one per new month)
  const monthLabels: { weekIndex: number; label: string }[] = []
  if (showMonthLabels) {
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const d = week[0] ? new Date(week[0].date) : null
      if (!d) return
      const m = d.getMonth()
      if (m !== lastMonth) {
        monthLabels.push({
          weekIndex: wi,
          label: d.toLocaleDateString('en-GB', { month: 'short' }),
        })
        lastMonth = m
      }
    })
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
      <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
        {/* Month labels */}
        {showMonthLabels && (
          <div
            style={{
              position: 'relative',
              height: '15px',
              marginBottom: '4px',
              minWidth: `${weeks.length * (CELL + GAP)}px`,
            }}
          >
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={weekIndex}
                style={{
                  position: 'absolute',
                  left: `${weekIndex * (CELL + GAP)}px`,
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.3px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Week columns */}
        <div style={{ display: 'flex', gap: `${GAP}px` }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di]
                const bg = cell ? heatmapCellColor(cell.count, color) : 'transparent'
                const tip = cell
                  ? `${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`
                  : undefined
                return (
                  <div
                    key={di}
                    title={tip}
                    style={{
                      width: `${CELL}px`,
                      height: `${CELL}px`,
                      borderRadius: '2px',
                      background: bg,
                      flexShrink: 0,
                      transition: 'opacity 0.1s',
                      cursor: cell?.count ? 'default' : 'default',
                    }}
                    onMouseEnter={e => {
                      if (cell?.count) (e.currentTarget as HTMLElement).style.opacity = '0.7'
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLElement).style.opacity = '1'
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
