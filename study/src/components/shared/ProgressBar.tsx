'use client'

interface ProgressBarProps {
  /** 0–100 */
  value: number
  color?: string
  /** Bar height in px (default 6) */
  height?: number
  /** Show percentage label above the bar */
  showLabel?: boolean
  /** Extra label on the right side (e.g. "8 / 124") */
  countLabel?: string
}

export default function ProgressBar({
  value,
  color = '#4ade80',
  height = 6,
  showLabel = false,
  countLabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div>
      {(showLabel || countLabel) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '6px',
            fontSize: '12px',
          }}
        >
          {showLabel && (
            <span style={{ color: 'var(--text-muted)' }}>Progress</span>
          )}
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 600,
              marginLeft: 'auto',
            }}
          >
            {countLabel ?? `${Math.round(pct)}%`}
          </span>
        </div>
      )}
      <div
        style={{
          height: `${height}px`,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: `${height}px`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: pct > 0 ? '3px' : '0',
          }}
        />
      </div>
    </div>
  )
}
