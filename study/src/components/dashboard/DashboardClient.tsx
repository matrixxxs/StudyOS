'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { RoadmapRow, StageRow, TopicRow, PlannedSessionRow } from '@/lib/types'
import {
  buildHeatmapCells,
  computeStreak,
  todayISO,
  type HeatmapCell,
} from '@/lib/utils'
import HeatmapGrid from '@/components/shared/HeatmapGrid'
import ProgressBar from '@/components/shared/ProgressBar'

// ─── Derived types ─────────────────────────────────────────────────────────────

interface RoadmapProgress {
  done: number
  total: number
  pct: number
}

interface CurrentPosition {
  stage: StageRow
  topic: TopicRow
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCurrentPosition(
  roadmap: RoadmapRow,
  stages: StageRow[],
  topics: TopicRow[]
): CurrentPosition | 'complete' | null {
  const rmStages = stages
    .filter(s => s.roadmap_id === roadmap.id)
    .sort((a, b) => a.order_index - b.order_index)
  if (!rmStages.length) return null

  const rmStageIds = new Set(rmStages.map(s => s.id))
  const rmTopics = topics.filter(t => rmStageIds.has(t.stage_id))

  // Prefer stored pointer if it points to an undone topic
  if (roadmap.current_stage_id && roadmap.current_topic_id) {
    const stage = rmStages.find(s => s.id === roadmap.current_stage_id)
    const topic = rmTopics.find(t => t.id === roadmap.current_topic_id && !t.is_done)
    if (stage && topic) return { stage, topic }
  }

  // Derive: first undone topic in order
  for (const stage of rmStages) {
    const sorted = rmTopics
      .filter(t => t.stage_id === stage.id)
      .sort((a, b) => a.order_index - b.order_index)
    const first = sorted.find(t => !t.is_done)
    if (first) return { stage, topic: first }
  }

  return 'complete'
}

function computeRoadmapProgress(
  roadmap: RoadmapRow,
  stages: StageRow[],
  topics: TopicRow[]
): RoadmapProgress {
  const rmStageIds = new Set(stages.filter(s => s.roadmap_id === roadmap.id).map(s => s.id))
  const rmTopics = topics.filter(t => rmStageIds.has(t.stage_id))
  const done  = rmTopics.filter(t => t.is_done).length
  const total = rmTopics.length
  return { done, total, pct: total === 0 ? 0 : (done / total) * 100 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        minWidth: '100px',
      }}
    >
      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}

// ─── Roadmap Card ─────────────────────────────────────────────────────────────

function RoadmapCard({
  roadmap,
  progress,
  currentPos,
}: {
  roadmap: RoadmapRow
  progress: RoadmapProgress
  currentPos: CurrentPosition | 'complete' | null
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/roadmap/${roadmap.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${hovered ? roadmap.color + '55' : 'var(--border)'}`,
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
          transform: hovered ? 'translateY(-2px)' : 'none',
          boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Color accent bar */}
          <div
            style={{
              width: '3px',
              height: '44px',
              borderRadius: '2px',
              background: roadmap.color,
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '4px',
                letterSpacing: '-0.2px',
              }}
            >
              {roadmap.name}
            </div>
            {roadmap.description && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {roadmap.description}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: '16px',
              color: hovered ? roadmap.color : 'var(--text-muted)',
              transition: 'color 0.15s, transform 0.15s',
              transform: hovered ? 'translateX(3px)' : 'none',
              flexShrink: 0,
            }}
          >
            →
          </div>
        </div>

        {/* Current position */}
        {currentPos === 'complete' ? (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--accent-muted)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            🎉 Roadmap complete!
          </div>
        ) : currentPos ? (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '2px',
              }}
            >
              Resume here
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1px' }}>
              {currentPos.stage.title}
            </div>
            <div>→ {currentPos.topic.title}</div>
          </div>
        ) : (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            No stages yet — add some in Admin.
          </div>
        )}

        {/* Progress bar */}
        <div>
          <ProgressBar value={progress.pct} color={roadmap.color} height={5} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontWeight: 600, color: roadmap.color }}>
              {Math.round(progress.pct)}% complete
            </span>
            <span>
              {progress.done} / {progress.total} topics
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Today's Focus ────────────────────────────────────────────────────────────

function TodaysFocus({
  sessions,
  roadmaps,
  stages,
  topics,
}: {
  sessions: PlannedSessionRow[]
  roadmaps: RoadmapRow[]
  stages: StageRow[]
  topics: TopicRow[]
}) {
  // Build lookup maps for joining
  const rmMap  = Object.fromEntries(roadmaps.map(r => [r.id, r]))
  const stMap  = Object.fromEntries(stages.map(s => [s.id, s]))
  const tpMap  = Object.fromEntries(topics.map(t => [t.id, t]))

  const todaySorted = [...sessions].sort((a, b) =>
    (a.start_time ?? '').localeCompare(b.start_time ?? '')
  )

  const theory     = todaySorted.filter(s => s.topic_id && tpMap[s.topic_id ?? '']?.category === 'theory')
  const practical  = todaySorted.filter(s => s.topic_id && tpMap[s.topic_id ?? '']?.category === 'practical')
  const other      = todaySorted.filter(s => !s.topic_id || !['theory', 'practical'].includes(tpMap[s.topic_id]?.category ?? ''))

  const SectionItems = ({ items }: { items: PlannedSessionRow[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map(s => {
        const rm = rmMap[s.roadmap_id]
        const tp = s.topic_id ? tpMap[s.topic_id] : null
        const st = s.stage_id ? stMap[s.stage_id] : null
        return (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <div
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: rm?.color ?? 'var(--accent)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tp?.title ?? st?.title ?? rm?.name ?? 'Session'}
              </div>
              {st && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.title}</div>
              )}
            </div>
            {s.start_time && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                {s.start_time.slice(0, 5)}
                {s.end_time ? ` – ${s.end_time.slice(0, 5)}` : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  if (!sessions.length) {
    return (
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border)',
          borderRadius: '14px',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🗓️</div>
        <p
          style={{
            margin: '0 0 14px',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          No study sessions planned for today.
        </p>
        <Link
          href="/calendar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.12s',
          }}
        >
          Plan in Calendar →
        </Link>
      </div>
    )
  }

  // Show split by category if there are theory+practical items
  const showSplit = theory.length > 0 && practical.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {showSplit ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Theory
            </div>
            <SectionItems items={theory} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Practical
            </div>
            <SectionItems items={practical} />
          </div>
        </div>
      ) : (
        <SectionItems items={sessions} />
      )}
      {other.length > 0 && !showSplit && <SectionItems items={other} />}
    </div>
  )
}

// ─── Main DashboardClient ──────────────────────────────────────────────────────

export default function DashboardClient() {
  const [roadmaps, setRoadmaps]               = useState<RoadmapRow[]>([])
  const [stages, setStages]                   = useState<StageRow[]>([])
  const [topics, setTopics]                   = useState<TopicRow[]>([])
  const [logDates, setLogDates]               = useState<string[]>([])
  const [todaySessions, setTodaySessions]     = useState<PlannedSessionRow[]>([])
  const [loading, setLoading]                 = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const today = todayISO()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10)

    const [
      { data: rm },
      { data: st },
      { data: tp },
      { data: le },
      { data: ps },
    ] = await Promise.all([
      supabase.from('roadmaps').select('*').order('created_at', { ascending: true }),
      supabase.from('stages').select('id, roadmap_id, title, order_index, timeframe_label, created_at'),
      supabase.from('topics').select('id, stage_id, title, category, order_index, is_done, done_at'),
      supabase.from('log_entries').select('date').gte('date', oneYearAgoStr),
      supabase.from('planned_sessions').select('*').eq('date', today),
    ])

    setRoadmaps((rm ?? []) as RoadmapRow[])
    setStages((st ?? []) as StageRow[])
    setTopics((tp ?? []) as TopicRow[])
    setLogDates(((le ?? []) as { date: string }[]).map(e => e.date))
    setTodaySessions((ps ?? []) as PlannedSessionRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Computed values ────────────────────────────────────────────────────────

  const heatmapCells: HeatmapCell[] = buildHeatmapCells(logDates)
  const streak          = computeStreak(logDates)
  const totalDays       = new Set(logDates).size
  const totalSessions   = logDates.length

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading dashboard…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const sectionTitle: React.CSSProperties = {
    margin: '0 0 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '22px 24px',
  }

  return (
    <div className="dashboard-wrapper">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            {roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''} · {totalSessions} total sessions logged
          </p>
        </div>
        <Link
          href="/log"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '9px',
            background: 'var(--accent)',
            color: '#0f1115',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '-0.1px',
          }}
        >
          + Log Session
        </Link>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="stats-row">
        <StatBadge icon="🔥" value={streak.current} label="current streak" />
        <StatBadge icon="🏆" value={streak.longest} label="longest streak" />
        <StatBadge icon="📅" value={totalDays} label="days logged" />
        <StatBadge icon="📊" value={totalSessions} label="total sessions" />
      </div>

      {/* ── Heatmap + Today's Focus ─────────────────────────────────────── */}
      <div className="dashboard-grid">
        {/* Heatmap */}
        <div style={card}>
          <h2 style={sectionTitle}>Activity Heatmap (all roadmaps)</h2>
          <HeatmapGrid cells={heatmapCells} color="#4ade80" />
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{streak.current}</strong> day current streak
            </span>
            <span>·</span>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{streak.longest}</strong> day best
            </span>
            <span>·</span>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{totalDays}</strong> unique days
            </span>
          </div>
        </div>

        {/* Today's Focus */}
        <div style={card}>
          <h2 style={sectionTitle}>Today&apos;s Focus</h2>
          <TodaysFocus
            sessions={todaySessions}
            roadmaps={roadmaps}
            stages={stages}
            topics={topics}
          />
        </div>
      </div>

      {/* ── Roadmaps grid ─────────────────────────────────────────────────── */}
      <div>
        <h2 style={sectionTitle}>Roadmaps</h2>

        {roadmaps.length === 0 ? (
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
            <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--text-secondary)' }}>
              No roadmaps yet. Create one in the Admin section.
            </p>
            <Link
              href="/admin"
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'var(--accent)',
                color: '#0f1115',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Go to Admin
            </Link>
          </div>
        ) : (
          <div className="roadmaps-grid">
            {roadmaps.map(r => (
              <RoadmapCard
                key={r.id}
                roadmap={r}
                progress={computeRoadmapProgress(r, stages, topics)}
                currentPos={deriveCurrentPosition(r, stages, topics)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
