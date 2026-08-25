'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RoadmapRow } from '@/lib/types'
import ColorPicker from './ColorPicker'
import ConfirmDialog from './ConfirmDialog'
import RoadmapEditor from './RoadmapEditor'

// ─── Shared button helpers ─────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  variant = 'ghost',
  disabled = false,
  type = 'button',
  style: extraStyle = {},
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'danger' | 'ghost' | 'outline'
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'opacity 0.12s, background 0.12s',
    opacity: disabled ? 0.45 : 1, fontFamily: 'inherit',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#0f1115' },
    danger:  { background: 'var(--danger)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  }
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...extraStyle }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.opacity = '0.82' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled ? '0.45' : '1' }}
    >
      {children}
    </button>
  )
}

// ─── Section heading ───────────────────────────────────────────────────────

function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="admin-header">
      <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
        {title}
      </h1>
      {action}
    </div>
  )
}

// ─── Roadmap list card ─────────────────────────────────────────────────────

function RoadmapCard({
  roadmap,
  onEdit,
  onDelete,
}: {
  roadmap: RoadmapRow
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3d45' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
    >
      {/* Color swatch */}
      <div style={{
        width: '10px', height: '42px', borderRadius: '5px',
        background: roadmap.color, flexShrink: 0,
      }} />

      {/* Name + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '3px' }}>
          {roadmap.name}
        </div>
        {roadmap.description && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {roadmap.description}
          </div>
        )}
      </div>

      {/* Created date */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
        {new Date(roadmap.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <Btn onClick={onEdit} variant="outline" style={{ padding: '7px 14px' }}>
          ✏️ Edit
        </Btn>
        <Btn onClick={onDelete} variant="ghost" style={{ padding: '7px 14px', color: 'var(--danger)', borderColor: 'transparent' }}>
          🗑️ Delete
        </Btn>
      </div>
    </div>
  )
}

// ─── New roadmap form ──────────────────────────────────────────────────────

function NewRoadmapForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, color: string, desc: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#4ade80')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    try {
      await onSave(name.trim(), color, desc.trim())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  const fieldLabel: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent)',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 0 0 1px rgba(74,222,128,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
        New Roadmap
      </h3>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Name */}
        <div>
          <label style={fieldLabel}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Electronics & Embedded Systems"
            autoFocus
          />
        </div>

        {/* Color */}
        <div>
          <label style={fieldLabel}>Color (for calendar dots & progress bar)</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        {/* Description */}
        <div>
          <label style={fieldLabel}>Description (optional)</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Short blurb about this roadmap…"
            rows={2}
          />
        </div>
      </div>

      {error && (
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--danger)' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <Btn onClick={onCancel} variant="ghost" disabled={saving}>Cancel</Btn>
        <Btn type="submit" variant="primary" disabled={saving}>
          {saving ? 'Creating…' : '+ Create Roadmap'}
        </Btn>
      </div>
    </form>
  )
}

// ─── Main AdminPanel component ─────────────────────────────────────────────

export default function AdminPanel() {
  // View: 'list' shows all roadmaps; 'editor' shows the stage/topic editor
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Roadmap list state
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  // Delete confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadRoadmaps = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setRoadmaps((data ?? []) as RoadmapRow[])
    setLoading(false)
  }, [])

  useEffect(() => { loadRoadmaps() }, [loadRoadmaps])

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleCreateRoadmap = async (name: string, color: string, description: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('roadmaps').insert({ name, color, description: description || null } as any)
    if (error) throw new Error(error.message)
    setShowNewForm(false)
    await loadRoadmaps()
  }

  const handleDeleteRoadmap = (roadmap: RoadmapRow) => {
    setConfirmDialog({
      title: `Delete "${roadmap.name}"?`,
      message: `This will permanently remove all stages, topics, log entries, and planned sessions for this roadmap. This cannot be undone.`,
      onConfirm: async () => {
        await supabase.from('roadmaps').delete().eq('id', roadmap.id)
        setConfirmDialog(null)
        await loadRoadmaps()
      },
    })
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setView('editor')
  }

  const handleBackToList = () => {
    setView('list')
    setEditingId(null)
    loadRoadmaps() // refresh in case name/color changed in editor
  }

  // ── Editor view ───────────────────────────────────────────────────────────

  if (view === 'editor' && editingId) {
    return <RoadmapEditor roadmapId={editingId} onBack={handleBackToList} />
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0 0 60px' }}>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      <PageHeader
        title="Admin — Roadmaps"
        action={
          !showNewForm && (
            <Btn variant="primary" onClick={() => setShowNewForm(true)}>
              + New Roadmap
            </Btn>
          )
        }
      />

      <div className="admin-content">
        {/* New roadmap form */}
        {showNewForm && (
          <NewRoadmapForm
            onSave={handleCreateRoadmap}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {/* Roadmap list */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Loading roadmaps…
          </div>
        ) : roadmaps.length === 0 && !showNewForm ? (
          <div
            style={{
              padding: '60px 32px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              borderRadius: '14px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '15px' }}>
              No roadmaps yet. Create your first one to get started.
            </p>
            <Btn variant="primary" onClick={() => setShowNewForm(true)}>
              + New Roadmap
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roadmaps.map(r => (
              <RoadmapCard
                key={r.id}
                roadmap={r}
                onEdit={() => handleEdit(r.id)}
                onDelete={() => handleDeleteRoadmap(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
