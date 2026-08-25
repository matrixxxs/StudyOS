'use client'

export const COLOR_PALETTE = [
  { label: 'Green',   value: '#4ade80' }, // default / electronics
  { label: 'Emerald', value: '#34d399' },
  { label: 'Sky',     value: '#38bdf8' },
  { label: 'Blue',    value: '#60a5fa' },
  { label: 'Purple',  value: '#a78bfa' },
  { label: 'Fuchsia', value: '#e879f9' },
  { label: 'Pink',    value: '#f472b6' },
  { label: 'Orange',  value: '#fb923c' },
  { label: 'Amber',   value: '#fbbf24' },
  { label: 'Red',     value: '#f87171' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      {COLOR_PALETTE.map(c => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: c.value,
            border: value === c.value
              ? `3px solid #fff`
              : '2px solid transparent',
            outline: value === c.value ? `2px solid ${c.value}` : 'none',
            outlineOffset: '1px',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.1s, outline 0.1s',
            transform: value === c.value ? 'scale(1.15)' : 'scale(1)',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.transform =
              value === c.value ? 'scale(1.15)' : 'scale(1)'
          }}
        />
      ))}
      {/* Custom hex input for colours not in the palette */}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="#hex"
        style={{
          width: '82px',
          padding: '4px 8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--text-secondary)',
        }}
      />
      {/* Colour preview swatch */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: value,
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      />
    </div>
  )
}
