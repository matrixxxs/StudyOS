'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { RoadmapRow, StageRow, TopicRow } from '@/lib/types'
import { todayISO } from '@/lib/utils'

// ─── Button layout helper ───────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  style = {},
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'outline'
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 0.12s, background 0.12s',
    opacity: disabled ? 0.45 : 1,
    fontFamily: 'inherit',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#0f1115' },
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function LogFormClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form values
  const [date, setDate] = useState(todayISO())
  const [roadmapId, setRoadmapId] = useState('')
  const [stageId, setStageId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [commitLink, setCommitLink] = useState('')
  const [note, setNote] = useState('')
  const [markDone, setMarkDone] = useState(false)

  // DB Options
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([])
  const [stages, setStages] = useState<StageRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])

  // Loading/saving
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── 1. Load Roadmaps on Mount ──────────────────────────────────────────────

  useEffect(() => {
    async function loadRoadmaps() {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data) {
        setRoadmaps(data as RoadmapRow[])
      }
      setLoadingOptions(false)
    }
    loadRoadmaps()
  }, [])

  // ── 2. Handle pre-filled URL query parameters ──────────────────────────────

  useEffect(() => {
    if (loadingOptions || roadmaps.length === 0) return

    const rId = searchParams.get('roadmapId')
    const sId = searchParams.get('stageId')
    const tId = searchParams.get('topicId')

    if (rId && roadmaps.some(r => r.id === rId)) {
      setRoadmapId(rId)
      if (sId) setStageId(sId)
      if (tId) setTopicId(tId)
    }
  }, [loadingOptions, roadmaps, searchParams])

  // ── 3. Fetch stages for chosen roadmap ─────────────────────────────────────

  useEffect(() => {
    if (!roadmapId) {
      setStages([])
      setStageId('')
      setTopics([])
      setTopicId('')
      return
    }

    async function loadStages() {
      const { data } = await supabase
        .from('stages')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('order_index', { ascending: true })
      setStages((data ?? []) as StageRow[])
    }
    loadStages()
  }, [roadmapId])

  // ── 4. Fetch topics for chosen stage ───────────────────────────────────────

  useEffect(() => {
    if (!stageId) {
      setTopics([])
      setTopicId('')
      return
    }

    async function loadTopics() {
      const { data } = await supabase
        .from('topics')
        .select('*')
        .eq('stage_id', stageId)
        .order('order_index', { ascending: true })
      setTopics((data ?? []) as TopicRow[])
    }
    loadTopics()
  }, [stageId])

  // Reset mark-done checkbox if topic changes or is already done
  const selectedTopic = topics.find(t => t.id === topicId)
  useEffect(() => {
    setMarkDone(false)
  }, [topicId])

  // ── 5. Next Undone Pointer Derivation ──────────────────────────────────────

  const findNextUndoneTopic = async (
    currentRoadmapId: string,
    currentTopicId: string
  ): Promise<{ stageId: string; topicId: string } | null> => {
    // Fetch all stages + topics for this roadmap to walk them in order
    const [{ data: st }, { data: tp }] = await Promise.all([
      supabase.from('stages').select('*').eq('roadmap_id', currentRoadmapId).order('order_index', { ascending: true }),
      supabase.from('topics').select('*').order('order_index', { ascending: true }),
    ])

    const stageList = (st ?? []) as StageRow[]
    const topicList = (tp ?? []) as TopicRow[]

    // Map stages to their topics
    const stageIds = new Set(stageList.map(s => s.id))
    const roadmapTopics = topicList.filter(t => stageIds.has(t.stage_id))
    const topicsByStage: Record<string, TopicRow[]> = {}
    for (const t of roadmapTopics) {
      if (!topicsByStage[t.stage_id]) topicsByStage[t.stage_id] = []
      topicsByStage[t.stage_id].push(t)
    }

    // Sort stages by order_index
    const sortedStages = [...stageList].sort((a, b) => a.order_index - b.order_index)
    let foundCurrent = false

    for (const stage of sortedStages) {
      const stageTops = (topicsByStage[stage.id] ?? []).sort((a, b) => a.order_index - b.order_index)
      for (const t of stageTops) {
        // If we previously marked currentTopicId, the first undone topic after it is next
        // Note: we treat the topic we are currently marking done as 'done' for this search
        const isActuallyDone = t.is_done || t.id === currentTopicId
        if (foundCurrent && !isActuallyDone) {
          return { stageId: stage.id, topicId: t.id }
        }
        if (t.id === currentTopicId) {
          foundCurrent = true
        }
      }
    }
    return null
  }

  // ── 6. Submit handler ──────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roadmapId) { setError('Roadmap is required.'); return }
    if (!stageId) { setError('Stage is required.'); return }
    if (!timeSpent || parseInt(timeSpent, 10) <= 0) {
      setError('Time spent must be a positive number of minutes.')
      return
    }
    if (commitLink && !commitLink.startsWith('http://') && !commitLink.startsWith('https://')) {
      setError('Commit link must be a valid URL starting with http:// or https://')
      return
    }

    setSaving(true)
    setError('')

    try {
      const minutes = parseInt(timeSpent, 10)

      // A. Insert the log entry
      const logPayload = {
        roadmap_id: roadmapId,
        stage_id: stageId,
        topic_id: topicId || null,
        date: date,
        time_spent_minutes: minutes,
        commit_link: commitLink.trim() || null,
        note: note.trim() || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: logErr } = await supabase.from('log_entries').insert(logPayload as any)
      if (logErr) throw new Error(logErr.message)

      // B. Optional Mark Topic Done & Advance Resume Pointer
      if (topicId && markDone && selectedTopic && !selectedTopic.is_done) {
        const now = new Date().toISOString()

        // 1. Mark topic done
        const { error: topicErr } = await supabase
          .from('topics')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ is_done: true, done_at: now } as any)
          .eq('id', topicId)
        if (topicErr) throw new Error(topicErr.message)

        // 2. Compute and set next undone topic pointer
        const next = await findNextUndoneTopic(roadmapId, topicId)
        const { error: roadmapErr } = await supabase
          .from('roadmaps')
          .update({
            current_stage_id: next?.stageId ?? null,
            current_topic_id: next?.topicId ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
          .eq('id', roadmapId)
        if (roadmapErr) throw new Error(roadmapErr.message)
      }

      router.push('/history')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save log entry.')
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '28px 20px 80px',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
  }

  if (loadingOptions) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading form configurations…
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Link
          href="/"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          ← Dashboard
        </Link>
      </div>

      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Log Study Session
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          {/* Row 1: Date & Time spent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={fieldLabel}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={fieldLabel}>Time Spent (Minutes) *</label>
              <input
                type="number"
                value={timeSpent}
                onChange={e => setTimeSpent(e.target.value)}
                placeholder="e.g. 45"
                min="1"
                required
              />
            </div>
          </div>

          {/* Row 2: Roadmap selection */}
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
              <option value="">— Select Roadmap —</option>
              {roadmaps.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Stage selection */}
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
              <option value="">— Select Stage —</option>
              {stages.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Row 4: Topic selection (Optional) */}
          <div>
            <label style={fieldLabel}>Topic (Optional)</label>
            <select
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              disabled={!stageId}
            >
              <option value="">— Select Topic —</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.is_done ? '(Completed)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Mark Topic Done checkbox */}
          {selectedTopic && !selectedTopic.is_done && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: 'var(--accent-muted)',
                border: '1px solid var(--accent-dim)',
                borderRadius: '8px',
                marginTop: '-4px',
              }}
            >
              <input
                type="checkbox"
                id="markDoneCheckbox"
                checked={markDone}
                onChange={e => setMarkDone(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: 'var(--accent)',
                }}
              />
              <label
                htmlFor="markDoneCheckbox"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Mark topic &quot;{selectedTopic.title}&quot; as completed
              </label>
            </div>
          )}

          {/* Row 5: Commit link */}
          <div>
            <label style={fieldLabel}>Commit Link (Optional)</label>
            <input
              type="url"
              value={commitLink}
              onChange={e => setCommitLink(e.target.value)}
              placeholder="e.g. https://github.com/..."
            />
          </div>

          {/* Row 6: Note */}
          <div>
            <label style={fieldLabel}>Notes / What you learned</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Summary of what was built or studied..."
              rows={4}
            />
          </div>

          {error && (
            <p style={{ margin: '0', fontSize: '13px', color: 'var(--danger)', fontWeight: 500 }}>
              ⚠️ {error}
            </p>
          )}

          {/* Submit/Cancel */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Btn variant="ghost" disabled={saving}>Cancel</Btn>
            </Link>
            <Btn type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving log…' : '✓ Save Log Entry'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}
