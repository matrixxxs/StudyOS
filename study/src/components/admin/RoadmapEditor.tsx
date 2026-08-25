'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RoadmapRow, StageRow, TopicRow } from '@/lib/types'
import ColorPicker from './ColorPicker'
import ConfirmDialog from './ConfirmDialog'

// ─── Shared ────────────────────────────────────────────────────────────────

function Btn({
  children, onClick, variant = 'ghost', disabled = false, type = 'button', title, style: ex = {},
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary'|'danger'|'ghost'|'outline'|'icon'
  disabled?: boolean; type?: 'button'|'submit'; title?: string; style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '7px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
    transition: 'opacity 0.12s, background 0.12s', opacity: disabled ? 0.4 : 1, fontFamily: 'inherit',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#0f1115' },
    danger:  { background: 'transparent', color: 'var(--danger)', border: '1px solid transparent' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    icon:    { background: 'transparent', color: 'var(--text-muted)', padding: '5px 7px', fontSize: '15px' },
  }
  return (
    <button type={type} title={title} onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...ex }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled ? '0.4' : '1' }}
    >{children}</button>
  )
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px',
}

// ─── Category badge ────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: string | null }) {
  if (!cat) return null
  const colors: Record<string, string> = {
    theory:    'rgba(96,165,250,0.2)',
    practical: 'rgba(74,222,128,0.18)',
  }
  const textColors: Record<string, string> = {
    theory:    '#60a5fa',
    practical: '#4ade80',
  }
  const bg   = colors[cat]   ?? 'rgba(148,163,184,0.15)'
  const text = textColors[cat] ?? 'var(--text-secondary)'
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
      background: bg, color: text, textTransform: 'capitalize', letterSpacing: '0.3px', whiteSpace: 'nowrap',
    }}>
      {cat}
    </span>
  )
}

// ─── Topic row ─────────────────────────────────────────────────────────────

interface TopicRowProps {
  topic: TopicRow
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onSave: (title: string, category: string) => Promise<void>
}

function TopicRowItem({ topic, isFirst, isLast, onMoveUp, onMoveDown, onDelete, onSave }: TopicRowProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle]     = useState(topic.title)
  const [cat, setCat]         = useState(topic.category ?? '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave(title.trim(), cat.trim())
    setEditing(false)
    setSaving(false)
  }

  const handleCancel = () => {
    setTitle(topic.title)
    setCat(topic.category ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{
        padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px',
        border: '1px solid var(--accent)', marginBottom: '6px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={fieldLabel}>Topic title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              autoFocus />
          </div>
          <div>
            <label style={fieldLabel}>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">— none —</option>
              <option value="theory">theory</option>
              <option value="practical">practical</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Btn onClick={handleCancel} variant="ghost" disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSave} variant="primary" disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
      borderRadius: '7px', marginBottom: '4px',
      background: 'var(--bg-card)', border: '1px solid transparent',
      transition: 'border-color 0.12s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
    >
      {/* Reorder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
        <Btn onClick={onMoveUp}   variant="icon" disabled={isFirst}  title="Move up"   style={{ padding: '2px 5px', fontSize: '12px' }}>▲</Btn>
        <Btn onClick={onMoveDown} variant="icon" disabled={isLast}   title="Move down" style={{ padding: '2px 5px', fontSize: '12px' }}>▼</Btn>
      </div>
      <CategoryBadge cat={topic.category} />
      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', minWidth: 0 }}>{topic.title}</span>
      <Btn onClick={() => setEditing(true)} variant="icon" title="Edit topic">✏️</Btn>
      <Btn onClick={onDelete} variant="icon" title="Delete topic" style={{ color: 'var(--danger)' }}>🗑️</Btn>
    </div>
  )
}

// ─── Stage card ────────────────────────────────────────────────────────────

interface StageCardProps {
  stage: StageRow
  topics: TopicRow[]
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDeleteStage: () => void
  onSaveStage: (title: string, timeframe: string) => Promise<void>
  onAddTopic: (title: string, category: string) => Promise<void>
  onSaveTopic: (topicId: string, title: string, category: string) => Promise<void>
  onDeleteTopic: (topic: TopicRow) => void
  onMoveTopicUp: (topicIndex: number) => void
  onMoveTopicDown: (topicIndex: number) => void
}

function StageCard({
  stage, topics, isFirst, isLast,
  onMoveUp, onMoveDown, onDeleteStage, onSaveStage,
  onAddTopic, onSaveTopic, onDeleteTopic, onMoveTopicUp, onMoveTopicDown,
}: StageCardProps) {
  const [collapsed, setCollapsed]       = useState(false)
  const [editingStage, setEditingStage] = useState(false)
  const [stageTitle, setStageTitle]     = useState(stage.title)
  const [stageTime, setStageTime]       = useState(stage.timeframe_label ?? '')
  const [savingStage, setSavingStage]   = useState(false)

  // Add-topic form
  const [showAddTopic, setShowAddTopic]   = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicCat, setNewTopicCat]     = useState('')
  const [addingTopic, setAddingTopic]     = useState(false)

  const handleSaveStage = async () => {
    if (!stageTitle.trim()) return
    setSavingStage(true)
    await onSaveStage(stageTitle.trim(), stageTime.trim())
    setEditingStage(false)
    setSavingStage(false)
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicTitle.trim()) return
    setAddingTopic(true)
    await onAddTopic(newTopicTitle.trim(), newTopicCat.trim())
    setNewTopicTitle(''); setNewTopicCat('')
    setAddingTopic(false)
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: '12px', marginBottom: '12px', overflow: 'hidden',
    }}>
      {/* Stage header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 16px', borderBottom: collapsed ? 'none' : '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        {/* Reorder arrows */}
        <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
          <Btn onClick={onMoveUp}   variant="icon" disabled={isFirst}  title="Move stage up"   style={{ fontSize: '13px', padding: '3px 6px' }}>▲</Btn>
          <Btn onClick={onMoveDown} variant="icon" disabled={isLast}   title="Move stage down" style={{ fontSize: '13px', padding: '3px 6px' }}>▼</Btn>
        </div>

        {/* Stage info */}
        {editingStage ? (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 180px', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={fieldLabel}>Stage title *</label>
              <input type="text" value={stageTitle} onChange={e => setStageTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveStage(); if (e.key === 'Escape') setEditingStage(false) }}
                autoFocus />
            </div>
            <div>
              <label style={fieldLabel}>Timeframe (optional)</label>
              <input type="text" value={stageTime} onChange={e => setStageTime(e.target.value)}
                placeholder="e.g. Week 1–3" />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {stage.title}
            </div>
            {stage.timeframe_label && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stage.timeframe_label}</div>
            )}
          </div>
        )}

        {/* Topic count badge */}
        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '99px',
          background: 'var(--bg-elevated)', color: 'var(--text-muted)', flexShrink: 0,
        }}>
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
        </span>

        {/* Header actions */}
        {editingStage ? (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <Btn onClick={() => setEditingStage(false)} variant="ghost" disabled={savingStage}>Cancel</Btn>
            <Btn onClick={handleSaveStage} variant="primary" disabled={savingStage || !stageTitle.trim()}>
              {savingStage ? '…' : 'Save'}
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <Btn onClick={() => setEditingStage(true)} variant="icon" title="Edit stage">✏️</Btn>
            <Btn onClick={onDeleteStage} variant="icon" title="Delete stage" style={{ color: 'var(--danger)' }}>🗑️</Btn>
            <Btn onClick={() => setCollapsed(c => !c)} variant="icon" title={collapsed ? 'Expand' : 'Collapse'}
              style={{ fontSize: '13px' }}>
              {collapsed ? '▶' : '▼'}
            </Btn>
          </div>
        )}
      </div>

      {/* Stage body: topics + add form */}
      {!collapsed && (
        <div style={{ padding: '14px 16px' }}>
          {/* Topics list */}
          {topics.length === 0 && !showAddTopic ? (
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No topics yet. Add one below.
            </p>
          ) : (
            <div style={{ marginBottom: '10px' }}>
              {topics.map((t, i) => (
                <TopicRowItem
                  key={t.id}
                  topic={t}
                  isFirst={i === 0}
                  isLast={i === topics.length - 1}
                  onMoveUp={() => onMoveTopicUp(i)}
                  onMoveDown={() => onMoveTopicDown(i)}
                  onDelete={() => onDeleteTopic(t)}
                  onSave={(title, cat) => onSaveTopic(t.id, title, cat)}
                />
              ))}
            </div>
          )}

          {/* Add topic form */}
          {showAddTopic ? (
            <form onSubmit={handleAddTopic} style={{
              padding: '12px', background: 'var(--bg-elevated)',
              border: '1px solid var(--accent)', borderRadius: '8px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={fieldLabel}>Topic title *</label>
                  <input type="text" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)}
                    placeholder="e.g. Ohm's Law" autoFocus />
                </div>
                <div>
                  <label style={fieldLabel}>Category</label>
                  <select value={newTopicCat} onChange={e => setNewTopicCat(e.target.value)}>
                    <option value="">— none —</option>
                    <option value="theory">theory</option>
                    <option value="practical">practical</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Btn onClick={() => { setShowAddTopic(false); setNewTopicTitle(''); setNewTopicCat('') }} variant="ghost" disabled={addingTopic}>
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" disabled={addingTopic || !newTopicTitle.trim()}>
                  {addingTopic ? 'Adding…' : '+ Add Topic'}
                </Btn>
              </div>
            </form>
          ) : (
            <Btn onClick={() => setShowAddTopic(true)} variant="ghost"
              style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent)', borderColor: 'var(--accent)', borderStyle: 'dashed' }}>
              + Add Topic
            </Btn>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RoadmapEditor ─────────────────────────────────────────────────────────

export default function RoadmapEditor({ roadmapId, onBack }: { roadmapId: string; onBack: () => void }) {
  const [roadmap, setRoadmap]           = useState<RoadmapRow | null>(null)
  const [stages, setStages]             = useState<StageRow[]>([])
  const [topicsByStage, setTopicsByStage] = useState<Record<string, TopicRow[]>>({})
  const [loading, setLoading]           = useState(true)

  // Roadmap header edit
  const [rmName, setRmName]   = useState('')
  const [rmColor, setRmColor] = useState('#4ade80')
  const [rmDesc, setRmDesc]   = useState('')
  const [savingRm, setSavingRm] = useState(false)
  const [rmSaved, setRmSaved]   = useState(false)

  // Add stage
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStageTitle, setNewStageTitle] = useState('')
  const [newStageTime, setNewStageTime]   = useState('')
  const [addingStage, setAddingStage]     = useState(false)

  // Delete confirm
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; onConfirm: () => void
  } | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)

    const [{ data: rm }, { data: st }] = await Promise.all([
      supabase.from('roadmaps').select('*').eq('id', roadmapId).single(),
      supabase.from('stages').select('*').eq('roadmap_id', roadmapId).order('order_index'),
    ])

    const roadmapData = rm as RoadmapRow | null
    const stageData   = st as StageRow[]  | null

    if (roadmapData) {
      setRoadmap(roadmapData)
      setRmName(roadmapData.name); setRmColor(roadmapData.color); setRmDesc(roadmapData.description ?? '')
    }

    const stageList = stageData ?? []
    setStages(stageList)

    if (stageList.length > 0) {
      const ids = stageList.map(s => s.id)
      const { data: topics } = await supabase
        .from('topics').select('*').in('stage_id', ids).order('order_index')
      const topicsTyped = (topics ?? []) as TopicRow[]
      const grouped: Record<string, TopicRow[]> = {}
      for (const t of topicsTyped) {
        if (!grouped[t.stage_id]) grouped[t.stage_id] = []
        grouped[t.stage_id].push(t)
      }
      setTopicsByStage(grouped)
    } else {
      setTopicsByStage({})
    }

    setLoading(false)
  }, [roadmapId])

  useEffect(() => { load() }, [load])

  // ── Roadmap update ──────────────────────────────────────────────────────

  const handleSaveRoadmap = async () => {
    if (!rmName.trim()) return
    setSavingRm(true)
    await supabase.from('roadmaps').update({
      name: rmName.trim(), color: rmColor, description: rmDesc.trim() || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).eq('id', roadmapId)
    setSavingRm(false)
    setRmSaved(true)
    setTimeout(() => setRmSaved(false), 2000)
    if (roadmap) setRoadmap({ ...roadmap, name: rmName.trim(), color: rmColor, description: rmDesc.trim() || null })
  }

  // ── Stage CRUD ──────────────────────────────────────────────────────────

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStageTitle.trim()) return
    setAddingStage(true)
    const { data } = await supabase.from('stages').insert({
      roadmap_id: roadmapId,
      title: newStageTitle.trim(),
      timeframe_label: newStageTime.trim() || null,
      order_index: stages.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    const newStage = data as StageRow | null
    if (newStage) {
      setStages(prev => [...prev, newStage])
      setTopicsByStage(prev => ({ ...prev, [newStage.id]: [] }))
    }
    setNewStageTitle(''); setNewStageTime(''); setShowAddStage(false); setAddingStage(false)
  }

  const handleSaveStage = async (stage: StageRow, title: string, timeframe: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('stages').update({ title, timeframe_label: timeframe || null } as any).eq('id', stage.id)
    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, title, timeframe_label: timeframe || null } : s))
  }

  const handleDeleteStage = (stage: StageRow) => {
    setConfirmDialog({
      title: `Delete stage "${stage.title}"?`,
      message: `All ${(topicsByStage[stage.id] ?? []).length} topics in this stage will also be deleted. This cannot be undone.`,
      onConfirm: async () => {
        await supabase.from('stages').delete().eq('id', stage.id)
        setStages(prev => prev.filter(s => s.id !== stage.id))
        setTopicsByStage(prev => { const n = { ...prev }; delete n[stage.id]; return n })
        setConfirmDialog(null)
      },
    })
  }

  const swapStageOrder = async (indexA: number, indexB: number) => {
    const a = stages[indexA], b = stages[indexB]
    if (!a || !b) return
    const newStages = [...stages]
    newStages[indexA] = { ...a, order_index: b.order_index }
    newStages[indexB] = { ...b, order_index: a.order_index }
    setStages(newStages)
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('stages').update({ order_index: b.order_index } as any).eq('id', a.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('stages').update({ order_index: a.order_index } as any).eq('id', b.id),
    ])
  }

  // ── Topic CRUD ──────────────────────────────────────────────────────────

  const handleAddTopic = async (stageId: string, title: string, category: string) => {
    const existing = topicsByStage[stageId] ?? []
    const { data } = await supabase.from('topics').insert({
      stage_id: stageId, title, category: category || null, order_index: existing.length, is_done: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    const newTopic = data as TopicRow | null
    if (newTopic) {
      setTopicsByStage(prev => ({ ...prev, [stageId]: [...(prev[stageId] ?? []), newTopic] }))
    }
  }

  const handleSaveTopic = async (topicId: string, stageId: string, title: string, category: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('topics').update({ title, category: category || null } as any).eq('id', topicId)
    setTopicsByStage(prev => ({
      ...prev,
      [stageId]: (prev[stageId] ?? []).map(t => t.id === topicId ? { ...t, title, category: category || null } : t),
    }))
  }

  const handleDeleteTopic = (stageId: string, topic: TopicRow) => {
    setConfirmDialog({
      title: `Delete topic "${topic.title}"?`,
      message: 'Any log entries or planned sessions referencing this topic will have their topic reference cleared. The entries themselves are kept.',
      onConfirm: async () => {
        await supabase.from('topics').delete().eq('id', topic.id)
        setTopicsByStage(prev => ({
          ...prev, [stageId]: (prev[stageId] ?? []).filter(t => t.id !== topic.id),
        }))
        setConfirmDialog(null)
      },
    })
  }

  const swapTopicOrder = async (stageId: string, indexA: number, indexB: number) => {
    const topics = topicsByStage[stageId] ?? []
    const a = topics[indexA], b = topics[indexB]
    if (!a || !b) return
    const newTopics = [...topics]
    newTopics[indexA] = { ...a, order_index: b.order_index }
    newTopics[indexB] = { ...b, order_index: a.order_index }
    setTopicsByStage(prev => ({ ...prev, [stageId]: newTopics }))
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('topics').update({ order_index: b.order_index } as any).eq('id', a.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('topics').update({ order_index: a.order_index } as any).eq('id', b.id),
    ])
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading…
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div style={{ padding: '40px 32px' }}>
        <p style={{ color: 'var(--danger)' }}>Roadmap not found.</p>
        <button onClick={onBack}>← Back</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 80px' }}>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '20px 32px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', marginBottom: '28px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
          color: 'var(--text-secondary)', cursor: 'pointer', padding: '7px 14px',
          fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, display: 'flex',
          alignItems: 'center', gap: '6px', transition: 'background 0.12s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          ← Back
        </button>

        {/* Color indicator */}
        <div style={{ width: '10px', height: '28px', borderRadius: '5px', background: rmColor, flexShrink: 0 }} />

        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', flex: 1, letterSpacing: '-0.3px' }}>
          {roadmap.name}
        </h1>
      </div>

      <div style={{ padding: '0 32px' }}>

        {/* ── Roadmap details section ───────────────────────────────────── */}
        <section style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '24px', marginBottom: '32px',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Roadmap Details
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={fieldLabel}>Name *</label>
              <input type="text" value={rmName} onChange={e => setRmName(e.target.value)} />
            </div>

            <div>
              <label style={fieldLabel}>Color</label>
              <ColorPicker value={rmColor} onChange={setRmColor} />
            </div>

            <div>
              <label style={fieldLabel}>Description (optional)</label>
              <textarea value={rmDesc} onChange={e => setRmDesc(e.target.value)}
                placeholder="Short blurb about this roadmap…" rows={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', alignItems: 'center' }}>
            <button onClick={handleSaveRoadmap} disabled={savingRm || !rmName.trim()}
              style={{
                padding: '9px 20px', borderRadius: '8px', border: 'none',
                background: 'var(--accent)', color: '#0f1115', fontSize: '14px', fontWeight: 700,
                cursor: savingRm ? 'not-allowed' : 'pointer', opacity: savingRm ? 0.6 : 1,
                fontFamily: 'inherit',
              }}>
              {savingRm ? 'Saving…' : 'Save Details'}
            </button>
            {rmSaved && (
              <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>✓ Saved</span>
            )}
          </div>
        </section>

        {/* ── Stages section ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Stages ({stages.length})
          </h2>
          {!showAddStage && (
            <button onClick={() => setShowAddStage(true)} style={{
              padding: '7px 14px', borderRadius: '7px', border: '1px dashed var(--accent)',
              background: 'transparent', color: 'var(--accent)', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Stage
            </button>
          )}
        </div>

        {/* Stage cards */}
        {stages.length === 0 && !showAddStage ? (
          <div style={{
            padding: '48px 32px', textAlign: 'center',
            background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: '14px',
            marginBottom: '16px',
          }}>
            <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', fontSize: '14px' }}>
              No stages yet. Add one to start building this roadmap.
            </p>
            <button onClick={() => setShowAddStage(true)} style={{
              padding: '9px 18px', borderRadius: '8px', border: 'none',
              background: 'var(--accent)', color: '#0f1115', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Add First Stage</button>
          </div>
        ) : (
          stages.map((stage, i) => (
            <StageCard
              key={stage.id}
              stage={stage}
              topics={topicsByStage[stage.id] ?? []}
              isFirst={i === 0}
              isLast={i === stages.length - 1}
              onMoveUp={() => swapStageOrder(i, i - 1)}
              onMoveDown={() => swapStageOrder(i, i + 1)}
              onDeleteStage={() => handleDeleteStage(stage)}
              onSaveStage={(title, time) => handleSaveStage(stage, title, time)}
              onAddTopic={(title, cat) => handleAddTopic(stage.id, title, cat)}
              onSaveTopic={(topicId, title, cat) => handleSaveTopic(topicId, stage.id, title, cat)}
              onDeleteTopic={(topic) => handleDeleteTopic(stage.id, topic)}
              onMoveTopicUp={(ti) => swapTopicOrder(stage.id, ti, ti - 1)}
              onMoveTopicDown={(ti) => swapTopicOrder(stage.id, ti, ti + 1)}
            />
          ))
        )}

        {/* Add stage form */}
        {showAddStage && (
          <form onSubmit={handleAddStage} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--accent)',
            borderRadius: '12px', padding: '20px', marginTop: '8px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Stage
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={fieldLabel}>Stage title *</label>
                <input type="text" value={newStageTitle} onChange={e => setNewStageTitle(e.target.value)}
                  placeholder="e.g. Stage 1 — Electronics Fundamentals" autoFocus />
              </div>
              <div>
                <label style={fieldLabel}>Timeframe (optional)</label>
                <input type="text" value={newStageTime} onChange={e => setNewStageTime(e.target.value)}
                  placeholder="e.g. Week 1–3" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowAddStage(false); setNewStageTitle(''); setNewStageTime('') }}
                style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={addingStage || !newStageTitle.trim()}
                style={{ padding: '8px 16px', borderRadius: '7px', border: 'none',
                  background: 'var(--accent)', color: '#0f1115', fontSize: '13px',
                  fontWeight: 700, cursor: addingStage ? 'not-allowed' : 'pointer',
                  opacity: addingStage ? 0.6 : 1, fontFamily: 'inherit' }}>
                {addingStage ? 'Adding…' : '+ Add Stage'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
