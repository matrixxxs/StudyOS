'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { LogEntryRow, RoadmapRow, StageRow, TopicRow, PlannedSessionRow } from '@/lib/types'
import { todayISO, hexToRgba, fmtMinutes } from '@/lib/utils'
import ConfirmDialog from '../admin/ConfirmDialog'

// ─── Button layout helper ───────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = 'ghost',
  disabled = false,
  type = 'button',
  style = {},
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 0.12s, background 0.12s',
    opacity: disabled ? 0.45 : 1,
    fontFamily: 'inherit',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#0f1115' },
    danger: { background: 'var(--danger)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  }
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLElement).style.opacity = '0.82'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.opacity = disabled ? '0.45' : '1'
      }}
    >
      {children}
    </button>
  )
}

// ─── Popover Tooltip Component ──────────────────────────────────────────────

interface TooltipProps {
  date: string
  logs: LogEntryRow[]
  plans: PlannedSessionRow[]
  isPast: boolean
  roadmaps: Record<string, RoadmapRow>
  stages: Record<string, StageRow>
  topics: Record<string, TopicRow>
  position: { x: number; y: number }
}

function DayTooltip({ date, logs, plans, isPast, roadmaps, stages, topics, position }: TooltipProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  // Determine what to display
  // Past displays logs. Present/Future displays plans.
  const showLogs = isPast ? logs.length > 0 : false
  const showPlans = !isPast ? plans.length > 0 : false

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x + 12}px`,
        top: `${position.y + 12}px`,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 14px',
        width: '260px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: 500,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {formattedDate}
      </div>

      {showLogs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map(log => {
            const rm = roadmaps[log.roadmap_id]
            const st = log.stage_id ? stages[log.stage_id] : null
            const tp = log.topic_id ? topics[log.topic_id] : null
            return (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: rm?.color ?? 'var(--border)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rm?.name ?? 'Roadmap'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                  {tp?.title ?? st?.title ?? 'Session Log'} • {fmtMinutes(log.time_spent_minutes)}
                </div>
                {log.note && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    &ldquo;{log.note}&rdquo;
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showPlans && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {plans.map(plan => {
            const rm = roadmaps[plan.roadmap_id]
            const st = plan.stage_id ? stages[plan.stage_id] : null
            const tp = plan.topic_id ? topics[plan.topic_id] : null
            return (
              <div key={plan.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: rm?.color ?? 'var(--border)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: plan.is_complete ? 'line-through' : 'none' }}>
                    {rm?.name ?? 'Planned Session'}
                  </span>
                  {plan.is_complete && <span style={{ fontSize: '10px', color: 'var(--accent)' }}>✓</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                  {tp?.title ?? st?.title ?? 'Planned Topic'}
                </div>
                {plan.start_time && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                    ⏰ {plan.start_time.slice(0, 5)} {plan.end_time ? `– ${plan.end_time.slice(0, 5)}` : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!showLogs && !showPlans && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No logged activity or plans
        </div>
      )}
    </div>
  )
}

// ─── Plan Session Form/Modal ───────────────────────────────────────────────

interface PlanModalProps {
  date: string
  plans: PlannedSessionRow[]
  roadmaps: RoadmapRow[]
  onSave: (session: Partial<PlannedSessionRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCancel: () => void
}

function PlanSessionModal({ date, plans, roadmaps, onSave, onDelete, onCancel }: PlanModalProps) {
  // We can manage multiple plans, or edit/create one.
  const [selectedPlan, setSelectedPlan] = useState<PlannedSessionRow | null>(null)
  const [isCreating, setIsCreating] = useState(plans.length === 0)

  // Form Fields
  const [roadmapId, setRoadmapId] = useState('')
  const [stageId, setStageId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  // DB options loaded dynamically
  const [stages, setStages] = useState<StageRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Load stages when roadmap changes ───────────────────────────────────────

  useEffect(() => {
    if (!roadmapId) { setStages([]); setStageId(''); setTopics([]); setTopicId(''); return }
    async function loadStages() {
      const { data } = await supabase.from('stages').select('*').eq('roadmap_id', roadmapId).order('order_index')
      setStages((data ?? []) as StageRow[])
    }
    loadStages()
  }, [roadmapId])

  // ── Load topics when stage changes ─────────────────────────────────────────

  useEffect(() => {
    if (!stageId) { setTopics([]); setTopicId(''); return }
    async function loadTopics() {
      const { data } = await supabase.from('topics').select('*').eq('stage_id', stageId).order('order_index')
      setTopics((data ?? []) as TopicRow[])
    }
    loadTopics()
  }, [stageId])

  // ── Populate form fields when editing ──────────────────────────────────────

  useEffect(() => {
    if (selectedPlan) {
      setRoadmapId(selectedPlan.roadmap_id)
      setStageId(selectedPlan.stage_id ?? '')
      setTopicId(selectedPlan.topic_id ?? '')
      setStartTime(selectedPlan.start_time ? selectedPlan.start_time.slice(0, 5) : '')
      setEndTime(selectedPlan.end_time ? selectedPlan.end_time.slice(0, 5) : '')
      setIsComplete(selectedPlan.is_complete)
      setIsCreating(false)
    } else {
      setRoadmapId('')
      setStageId('')
      setTopicId('')
      setStartTime('')
      setEndTime('')
      setIsComplete(false)
    }
  }, [selectedPlan])

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roadmapId) { setError('Roadmap is required.'); return }
    if (startTime && endTime && startTime > endTime) {
      setError('Start time must be before end time.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Compute notify_at (date + startTime combined into ISO timestamp)
      let notifyAt: string | null = null
      if (startTime) {
        // Construct YYYY-MM-DDTHH:MM in local timezone offset
        const combined = new Date(`${date}T${startTime}:00`)
        if (!isNaN(combined.getTime())) {
          notifyAt = combined.toISOString()
        }
      }

      const payload: Partial<PlannedSessionRow> = {
        date,
        roadmap_id: roadmapId,
        stage_id: stageId || null,
        topic_id: topicId || null,
        start_time: startTime ? `${startTime}:00` : null,
        end_time: endTime ? `${endTime}:00` : null,
        is_complete: isComplete,
        notify_at: notifyAt,
      }

      if (selectedPlan) {
        payload.id = selectedPlan.id
      }

      await onSave(payload)
      setSaving(false)
      onCancel()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  const handleDeleteClick = (planId: string) => {
    setDeletingId(planId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    setSaving(true)
    await onDelete(deletingId)
    setSaving(false)
    setDeletingId(null)
    onCancel()
  }

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      {deletingId && (
        <ConfirmDialog
          title="Delete Planned Session?"
          message="This will remove this study plan from your calendar. This cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <div
        onClick={e => e.stopPropagation()}
        className="animate-scale-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Plan Study Session
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formattedDate}</span>
        </div>

        {/* Existing plans list on this day (if we aren't creating) */}
        {!isCreating && !selectedPlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Planned on this day:
            </div>
            {plans.map(p => {
              const rmName = roadmaps.find(r => r.id === p.roadmap_id)?.name ?? 'Roadmap'
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: p.is_complete ? 'line-through' : 'none' }}>
                      {rmName}
                    </span>
                    {p.start_time && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ⏰ {p.start_time.slice(0, 5)} {p.end_time ? `– ${p.end_time.slice(0, 5)}` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Btn onClick={() => setSelectedPlan(p)} variant="ghost" style={{ padding: '4px 10px', fontSize: '11px' }}>
                      ✏️ Edit
                    </Btn>
                    <Btn onClick={() => handleDeleteClick(p.id)} variant="ghost" style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)' }}>
                      🗑️
                    </Btn>
                  </div>
                </div>
              )
            })}
            <Btn onClick={() => setIsCreating(true)} variant="outline" style={{ borderStyle: 'dashed', marginTop: '4px' }}>
              + Add Another Plan
            </Btn>
          </div>
        )}

        {/* Edit / Create Form */}
        {(isCreating || selectedPlan) && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={fieldLabel}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={fieldLabel}>Roadmap *</label>
              <select
                value={roadmapId}
                onChange={e => {
                  setRoadmapId(e.target.value)
                  setStageId('')
                  setTopicId('')
                }}
                required
              >
                <option value="">— Select —</option>
                {roadmaps.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={fieldLabel}>Stage *</label>
              <select
                value={stageId}
                onChange={e => {
                  setStageId(e.target.value)
                  setTopicId('')
                }}
                disabled={!roadmapId}
                required
              >
                <option value="">— Select —</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={fieldLabel}>Topic (Optional)</label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                disabled={!stageId}
              >
                <option value="">— Select —</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title} {t.is_done ? '(Done)' : ''}</option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-dim)',
                  borderRadius: '8px',
                }}
              >
                <input
                  type="checkbox"
                  id="completePlan"
                  checked={isComplete}
                  onChange={e => setIsComplete(e.target.checked)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="completePlan" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                  Mark this planned session as completed
                </label>
              </div>
            )}

            {error && <p style={{ margin: 0, fontSize: '12px', color: 'var(--danger)' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              {selectedPlan ? (
                <Btn
                  onClick={() => setSelectedPlan(null)}
                  variant="ghost"
                  disabled={saving}
                >
                  Back
                </Btn>
              ) : (
                plans.length > 0 && (
                  <Btn onClick={() => setIsCreating(false)} variant="ghost" disabled={saving}>
                    Back
                  </Btn>
                )
              )}

              <Btn type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : selectedPlan ? 'Save Changes' : '+ Add Plan'}
              </Btn>
            </div>
          </form>
        )}

        {/* Global cancel/close (visible when not editing or creating, or as overall close) */}
        {!isCreating && !selectedPlan && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <Btn onClick={onCancel} variant="ghost">Close</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main CalendarClient ───────────────────────────────────────────────────

export default function CalendarClient() {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([])
  const [stages, setStages] = useState<StageRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [logEntries, setLogEntries] = useState<LogEntryRow[]>([])
  const [plannedSessions, setPlannedSessions] = useState<PlannedSessionRow[]>([])
  const [loading, setLoading] = useState(true)

  // Active overlays
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [activeDate, setActiveDate] = useState<string | null>(null) // Clicked day modal

  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ── Load calendar data ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)

    // Query everything
    const [
      { data: rm },
      { data: st },
      { data: tp },
      { data: le },
      { data: ps },
    ] = await Promise.all([
      supabase.from('roadmaps').select('*'),
      supabase.from('stages').select('*'),
      supabase.from('topics').select('*'),
      supabase.from('log_entries').select('*'),
      supabase.from('planned_sessions').select('*'),
    ])

    setRoadmaps((rm ?? []) as RoadmapRow[])
    setStages((st ?? []) as StageRow[])
    setTopics((tp ?? []) as TopicRow[])
    setLogEntries((le ?? []) as LogEntryRow[])
    setPlannedSessions((ps ?? []) as PlannedSessionRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Mutation Handlers ──────────────────────────────────────────────────────

  const handleSavePlan = async (session: Partial<PlannedSessionRow>) => {
    if (session.id) {
      // Edit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('planned_sessions').update(session as any).eq('id', session.id)
      if (error) throw new Error(error.message)
      setPlannedSessions(prev => prev.map(p => p.id === session.id ? { ...p, ...session } as PlannedSessionRow : p))
    } else {
      // Create
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from('planned_sessions').insert(session as any).select().single()
      if (error) throw new Error(error.message)
      if (data) {
        setPlannedSessions(prev => [...prev, data as PlannedSessionRow])
      }
    }
  }

  const handleDeletePlan = async (id: string) => {
    await supabase.from('planned_sessions').delete().eq('id', id)
    setPlannedSessions(prev => prev.filter(p => p.id !== id))
  }

  // ── Month grid calculation ─────────────────────────────────────────────────

  const getLocalDateString = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dateVal = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dateVal}`
  }

  const { year, month } = currentDate

  // Find Sunday that starts the 6x7 grid
  const firstOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstOfMonth.getDay() // 0 = Sun, 6 = Sat
  
  const gridStartDate = new Date(firstOfMonth)
  gridStartDate.setDate(firstOfMonth.getDate() - startDayOfWeek)

  const daysGrid: { dayNumber: number; dateString: string; isCurrentMonth: boolean }[] = []

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStartDate)
    cellDate.setDate(gridStartDate.getDate() + i)
    
    daysGrid.push({
      dayNumber: cellDate.getDate(),
      dateString: getLocalDateString(cellDate),
      isCurrentMonth: cellDate.getMonth() === month && cellDate.getFullYear() === year,
    })
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }

  // ── Lookup maps ────────────────────────────────────────────────────────────

  const rmMap = Object.fromEntries(roadmaps.map(r => [r.id, r]))
  const stMap = Object.fromEntries(stages.map(s => [s.id, s]))
  const tpMap = Object.fromEntries(topics.map(t => [t.id, t]))

  // Group items by date for grid mapping
  const logsByDate: Record<string, LogEntryRow[]> = {}
  for (const log of logEntries) {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log)
  }

  const plansByDate: Record<string, PlannedSessionRow[]> = {}
  for (const plan of plannedSessions) {
    if (!plansByDate[plan.date]) plansByDate[plan.date] = []
    plansByDate[plan.date].push(plan)
  }

  const todayStr = todayISO()

  // Tooltip handlers
  const handleMouseEnterCell = (dateString: string, e: React.MouseEvent) => {
    if (popoverTimeoutRef.current) clearTimeout(popoverTimeoutRef.current)
    setTooltipPos({ x: e.clientX, y: e.clientY })
    setHoveredDate(dateString)
  }

  const handleMouseMoveCell = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeaveCell = () => {
    popoverTimeoutRef.current = setTimeout(() => {
      setHoveredDate(null)
    }, 100)
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading calendar planner…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '24px 28px',
        height: 'calc(100dvh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Tooltip Popover */}
      {hoveredDate && (
        <DayTooltip
          date={hoveredDate}
          logs={logsByDate[hoveredDate] ?? []}
          plans={plansByDate[hoveredDate] ?? []}
          isPast={hoveredDate <= todayStr}
          roadmaps={rmMap}
          stages={stMap}
          topics={tpMap}
          position={tooltipPos}
        />
      )}

      {/* Plan Form Modal */}
      {activeDate && (
        <PlanSessionModal
          date={activeDate}
          plans={plansByDate[activeDate] ?? []}
          roadmaps={roadmaps}
          onSave={handleSavePlan}
          onDelete={handleDeletePlan}
          onCancel={() => setActiveDate(null)}
        />
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Study Calendar
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Schedule future study tasks or hover past days to see completed session notes.
          </p>
        </div>

        {/* Month selector controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
            {new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Btn onClick={handlePrevMonth} variant="ghost" style={{ padding: '6px 12px' }}>
              ◀
            </Btn>
            <Btn onClick={handleNextMonth} variant="ghost" style={{ padding: '6px 12px' }}>
              ▶
            </Btn>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Days of week header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center',
            padding: '10px 0',
            flexShrink: 0,
            minWidth: '700px',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <span key={day} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {day}
            </span>
          ))}
        </div>

        {/* Grid Cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            background: 'var(--border)',
            gap: '1px',
            flex: 1,
            minWidth: '700px',
            minHeight: '420px',
          }}
        >
          {daysGrid.map(({ dayNumber, dateString, isCurrentMonth }) => {
            const isToday = dateString === todayStr
            const cellLogs = logsByDate[dateString] ?? []
            const cellPlans = plansByDate[dateString] ?? []

            // Determine dots list
            // Past & Today show actual log entries. Future shows planned sessions.
            const showPastLogs = dateString <= todayStr
            const dotsSource = showPastLogs ? cellLogs : cellPlans

            return (
              <div
                key={dateString}
                onClick={() => setActiveDate(dateString)}
                onMouseEnter={e => {
                  handleMouseEnterCell(dateString, e)
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
                }}
                onMouseMove={handleMouseMoveCell}
                onMouseLeave={e => {
                  handleMouseLeaveCell()
                  ;(e.currentTarget as HTMLElement).style.background = isCurrentMonth ? 'var(--bg-surface)' : 'rgba(26, 29, 36, 0.4)'
                }}
                style={{
                  background: isCurrentMonth ? 'var(--bg-surface)' : 'rgba(26, 29, 36, 0.4)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  position: 'relative',
                  border: isToday ? '2px solid var(--accent)' : 'none',
                  margin: isToday ? '-1px' : '0',
                  zIndex: isToday ? 2 : 'auto',
                  transition: 'background 0.15s',
                  minWidth: 0,
                  minHeight: 0,
                }}
              >
                {/* Day number */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isToday ? 800 : 500,
                    color: isToday
                      ? 'var(--accent)'
                      : isCurrentMonth
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  }}
                >
                  {dayNumber}
                </span>

                {/* Dots row */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', minHeight: '8px', paddingBottom: '2px' }}>
                  {dotsSource.map((item, idx) => {
                    const rm = rmMap[item.roadmap_id]
                    const color = rm?.color ?? 'var(--border)'
                    const isPlanComplete = !showPastLogs && (item as PlannedSessionRow).is_complete

                    return (
                      <div
                        key={item.id ?? idx}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: color,
                          border: isPlanComplete ? '1px solid #fff' : 'none',
                          opacity: isPlanComplete ? 0.45 : 1,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
