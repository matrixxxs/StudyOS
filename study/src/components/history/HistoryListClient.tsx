'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { LogEntryRow, RoadmapRow, StageRow, TopicRow } from '@/lib/types'
import { fmtDate, fmtMinutes } from '@/lib/utils'
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
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
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

// ─── Truncated Note Component ─────────────────────────────────────────────────

function NoteCell({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes</span>

  const isLong = text.length > 100
  const displayedText = isLong && !expanded ? text.slice(0, 100) + '…' : text

  return (
    <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{displayedText}</span>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0 4px',
            fontFamily: 'inherit',
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

// ─── Inline/Modal Edit Form Component ───────────────────────────────────────

interface EditModalProps {
  entry: LogEntryRow
  roadmaps: RoadmapRow[]
  stages: StageRow[]
  topics: TopicRow[]
  onSave: (updated: Partial<LogEntryRow>) => Promise<void>
  onCancel: () => void
}

function EditLogModal({ entry, roadmaps, stages, topics, onSave, onCancel }: EditModalProps) {
  const [date, setDate] = useState(entry.date)
  const [roadmapId, setRoadmapId] = useState(entry.roadmap_id)
  const [stageId, setStageId] = useState(entry.stage_id ?? '')
  const [topicId, setTopicId] = useState(entry.topic_id ?? '')
  const [timeSpent, setTimeSpent] = useState(String(entry.time_spent_minutes))
  const [commitLink, setCommitLink] = useState(entry.commit_link ?? '')
  const [note, setNote] = useState(entry.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Filtered lists
  const filteredStages = stages.filter(s => s.roadmap_id === roadmapId)
  const filteredTopics = topics.filter(t => t.stage_id === stageId)

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
      await onSave({
        date,
        roadmap_id: roadmapId,
        stage_id: stageId || null,
        topic_id: topicId || null,
        time_spent_minutes: parseInt(timeSpent, 10),
        commit_link: commitLink.trim() || null,
        note: note.trim() || null,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
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
      <div
        onClick={e => e.stopPropagation()}
        className="animate-scale-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Edit Log Entry
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={fieldLabel}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={fieldLabel}>Time (min) *</label>
              <input type="number" value={timeSpent} onChange={e => setTimeSpent(e.target.value)} min="1" required />
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
              {filteredStages.map(s => (
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
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>{t.title} {t.is_done ? '(Done)' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={fieldLabel}>Commit Link (Optional)</label>
            <input type="url" value={commitLink} onChange={e => setCommitLink(e.target.value)} placeholder="https://github.com/..." />
          </div>

          <div>
            <label style={fieldLabel}>Notes</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} />
          </div>

          {error && <p style={{ margin: 0, fontSize: '12px', color: 'var(--danger)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Btn onClick={onCancel} variant="ghost" disabled={saving}>Cancel</Btn>
            <Btn type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main HistoryListClient ─────────────────────────────────────────────────

export default function HistoryListClient() {
  const [logEntries, setLogEntries] = useState<LogEntryRow[]>([])
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([])
  const [stages, setStages] = useState<StageRow[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterRoadmapId, setFilterRoadmapId] = useState('')
  const [filterStageId, setFilterStageId] = useState('')
  const [filterTopicId, setFilterTopicId] = useState('')

  // Edit / Delete State
  const [editingEntry, setEditingEntry] = useState<LogEntryRow | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<LogEntryRow | null>(null)

  // ── Load Data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const [
      { data: le },
      { data: rm },
      { data: st },
      { data: tp },
    ] = await Promise.all([
      supabase.from('log_entries').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('roadmaps').select('*'),
      supabase.from('stages').select('*'),
      supabase.from('topics').select('*'),
    ])

    setLogEntries((le ?? []) as LogEntryRow[])
    setRoadmaps((rm ?? []) as RoadmapRow[])
    setStages((st ?? []) as StageRow[])
    setTopics((tp ?? []) as TopicRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Actions handlers ───────────────────────────────────────────────────────

  const handleSaveEdit = async (updated: Partial<LogEntryRow>) => {
    if (!editingEntry) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('log_entries').update(updated as any).eq('id', editingEntry.id)
    if (error) throw new Error(error.message)

    setLogEntries(prev => prev.map(entry => entry.id === editingEntry.id ? { ...entry, ...updated } : entry))
    setEditingEntry(null)
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    await supabase.from('log_entries').delete().eq('id', deletingEntry.id)
    setLogEntries(prev => prev.filter(entry => entry.id !== deletingEntry.id))
    setDeletingEntry(null)
  }

  // ── Filtering Logic ────────────────────────────────────────────────────────

  const filteredStages = stages.filter(s => s.roadmap_id === filterRoadmapId)
  const filteredTopics = topics.filter(t => t.stage_id === filterStageId)

  // Reset dependent filters if parent changes
  useEffect(() => {
    setFilterStageId('')
    setFilterTopicId('')
  }, [filterRoadmapId])

  useEffect(() => {
    setFilterTopicId('')
  }, [filterStageId])

  const filteredEntries = logEntries.filter(entry => {
    if (filterRoadmapId && entry.roadmap_id !== filterRoadmapId) return false
    if (filterStageId && entry.stage_id !== filterStageId) return false
    if (filterTopicId && entry.topic_id !== filterTopicId) return false
    return true
  })

  // ── Mapping Helpers ────────────────────────────────────────────────────────

  const rmMap = Object.fromEntries(roadmaps.map(r => [r.id, r]))
  const stMap = Object.fromEntries(stages.map(s => [s.id, s]))
  const tpMap = Object.fromEntries(topics.map(t => [t.id, t]))

  // ── Render ─────────────────────────────────────────────────────────────────

  const filterSelectStyle: React.CSSProperties = {
    maxWidth: '220px',
  }

  const listCardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  return (
    <div style={{ padding: '28px 32px 80px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Modals */}
      {editingEntry && (
        <EditLogModal
          entry={editingEntry}
          roadmaps={roadmaps}
          stages={stages}
          topics={topics}
          onSave={handleSaveEdit}
          onCancel={() => setEditingEntry(null)}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Delete Log Entry?"
          message="This will permanently delete this logged session. It will be removed from your activity stats and heatmap."
          onConfirm={handleDelete}
          onCancel={() => setDeletingEntry(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Study History
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredEntries.length} logged session{filteredEntries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/log" style={{ textDecoration: 'none' }}>
          <Btn variant="primary" style={{ padding: '8px 16px', fontSize: '13px' }}>+ Log Session</Btn>
        </Link>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          marginBottom: '20px',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Filter logs:
        </span>
        {/* Roadmap Filter */}
        <select
          value={filterRoadmapId}
          onChange={e => setFilterRoadmapId(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">All Roadmaps</option>
          {roadmaps.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* Stage Filter */}
        <select
          value={filterStageId}
          onChange={e => setFilterStageId(e.target.value)}
          disabled={!filterRoadmapId}
          style={filterSelectStyle}
        >
          <option value="">All Stages</option>
          {filteredStages.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        {/* Topic Filter */}
        <select
          value={filterTopicId}
          onChange={e => setFilterTopicId(e.target.value)}
          disabled={!filterStageId}
          style={filterSelectStyle}
        >
          <option value="">All Topics</option>
          {filteredTopics.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>

        {/* Reset Filters button */}
        {(filterRoadmapId || filterStageId || filterTopicId) && (
          <button
            onClick={() => {
              setFilterRoadmapId('')
              setFilterStageId('')
              setFilterTopicId('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px',
              fontFamily: 'inherit',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading study history…
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border)',
            borderRadius: '14px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📜</div>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No study sessions match your filter criteria.
          </p>
          <Link href="/log" style={{ textDecoration: 'none' }}>
            <Btn variant="primary">+ Log First Session</Btn>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEntries.map(entry => {
            const rm = rmMap[entry.roadmap_id]
            const st = entry.stage_id ? stMap[entry.stage_id] : null
            const tp = entry.topic_id ? tpMap[entry.topic_id] : null

            return (
              <div key={entry.id} style={listCardStyle}>
                {/* Top header row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Roadmap color bar */}
                    <div
                      style={{
                        width: '8px',
                        height: '24px',
                        borderRadius: '3px',
                        background: rm?.color ?? 'var(--border)',
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {rm?.name ?? 'Unknown Roadmap'}
                      </span>
                      {st && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          • {st.title} {tp ? ` → ${tp.title}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date and duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 500 }}>{fmtDate(entry.date)}</span>
                    <span
                      style={{
                        background: 'var(--bg-elevated)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: rm?.color ?? 'var(--accent)',
                      }}
                    >
                      {fmtMinutes(entry.time_spent_minutes)}
                    </span>
                  </div>
                </div>

                {/* Notes block */}
                <NoteCell text={entry.note} />

                {/* Footer action row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '10px',
                    marginTop: '2px',
                  }}
                >
                  {/* Left: commit link */}
                  {entry.commit_link ? (
                    <a
                      href={entry.commit_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12px',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                      }}
                    >
                      🔗 View Commit / Code
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No commit link
                    </span>
                  )}

                  {/* Right: edit/delete actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn onClick={() => setEditingEntry(entry)} variant="ghost">✏️ Edit</Btn>
                    <Btn onClick={() => setDeletingEntry(entry)} variant="ghost" style={{ color: 'var(--danger)', borderColor: 'transparent' }}>
                      🗑️ Delete
                    </Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
