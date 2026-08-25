'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { RoadmapRow, StageRow, TopicRow, LogEntryRow } from '@/lib/types'
import {
  buildHeatmapCells,
  computeStreak,
  computeWeeklyBuckets,
  hexToRgba,
  fmtRelative,
  fmtMinutes,
  type HeatmapCell,
  type WeeklyBucket,
} from '@/lib/utils'
import HeatmapGrid from '@/components/shared/HeatmapGrid'
import ProgressBar from '@/components/shared/ProgressBar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveCurrentPosition(
  roadmap: RoadmapRow,
  stages: StageRow[],
  topicsByStage: Record<string, TopicRow[]>
): { stage: StageRow; topic: TopicRow } | 'complete' | null {
  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index)
  if (!sorted.length) return null

  if (roadmap.current_stage_id && roadmap.current_topic_id) {
    const stage = sorted.find(s => s.id === roadmap.current_stage_id)
    const topic = (topicsByStage[roadmap.current_stage_id] ?? []).find(
      t => t.id === roadmap.current_topic_id && !t.is_done
    )
    if (stage && topic) return { stage, topic }
  }

  for (const stage of sorted) {
    const tops = (topicsByStage[stage.id] ?? []).sort((a, b) => a.order_index - b.order_index)
    const first = tops.find(t => !t.is_done)
    if (first) return { stage, topic: first }
  }

  return 'complete'
}

function findNextUndone(
  markedId: string,
  stages: StageRow[],
  topicsByStage: Record<string, TopicRow[]>
): { stageId: string; topicId: string } | null {
  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index)
  let found = false

  for (const stage of sorted) {
    const tops = (topicsByStage[stage.id] ?? []).sort((a, b) => a.order_index - b.order_index)
    for (const t of tops) {
      if (found && !t.is_done) return { stageId: stage.id, topicId: t.id }
      if (t.id === markedId) found = true
    }
  }
  return null
}

// ─── Weekly bar chart ─────────────────────────────────────────────────────────

function WeeklyBarChart({ buckets, color }: { buckets: WeeklyBucket[]; color: string }) {
  const max = Math.max(...buckets.map(b => b.minutes), 60)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '72px',
        }}
      >
        {buckets.map((b, i) => (
          <div
            key={i}
            style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}
          >
            <div
              title={`${b.label}: ${fmtMinutes(b.minutes)}`}
              style={{
                width: '100%',
                height: b.minutes === 0 ? '3px' : `${Math.max(6, (b.minutes / max) * 68)}px`,
                background:
                  b.minutes === 0
                    ? 'rgba(255,255,255,0.06)'
                    : hexToRgba(color, 0.75),
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.4s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            />
          </div>
        ))}
      </div>
      {/* Week labels (every 3rd) */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
        {buckets.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              fontSize: '9px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {i % 3 === 0 ? b.label : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: string | null }) {
  if (!cat) return null
  const styles: Record<string, { bg: string; color: string }> = {
    theory:    { bg: 'rgba(96,165,250,0.18)',  color: '#60a5fa' },
    practical: { bg: 'rgba(74,222,128,0.16)', color: '#4ade80' },
  }
  const s = styles[cat] ?? { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-secondary)' }
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: '99px',
        background: s.bg,
        color: s.color,
        textTransform: 'capitalize',
        letterSpacing: '0.3px',
        flexShrink: 0,
      }}
    >
      {cat}
    </span>
  )
}

// ─── Stage section (collapsible) ──────────────────────────────────────────────

interface StageSectionProps {
  stage: StageRow
  topics: TopicRow[]
  roadmapColor: string
  isExpanded: boolean
  onToggle: () => void
  onMarkDone: (topicId: string, stageId: string) => void
  currentTopicId: string | null
  markingIds: Set<string>
}

function StageSection({
  stage,
  topics,
  roadmapColor,
  isExpanded,
  onToggle,
  onMarkDone,
  currentTopicId,
  markingIds,
}: StageSectionProps) {
  const sorted  = [...topics].sort((a, b) => a.order_index - b.order_index)
  const done    = sorted.filter(t => t.is_done).length
  const total   = sorted.length
  const pct     = total === 0 ? 0 : (done / total) * 100

  const fieldLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Stage header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'var(--bg-card)',
          border: 'none',
          cursor: 'pointer',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        {/* Color dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: done === total && total > 0 ? roadmapColor : 'var(--border)',
            flexShrink: 0,
          }}
        />

        {/* Title + timeframe */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stage.title}
          </div>
          {stage.timeframe_label && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {stage.timeframe_label}
            </div>
          )}
        </div>

        {/* Mini progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '80px' }}>
            <ProgressBar value={pct} color={roadmapColor} height={4} />
          </div>
          <span style={{ ...fieldLabel, minWidth: '52px', textAlign: 'right' }}>
            {done}/{total}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              transition: 'transform 0.15s',
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              display: 'inline-block',
            }}
          >
            ▶
          </span>
        </div>
      </button>

      {/* Topics list */}
      {isExpanded && (
        <div style={{ padding: '8px 18px 14px' }}>
          {sorted.length === 0 ? (
            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No topics in this stage.
            </p>
          ) : (
            sorted.map(topic => {
              const isCurrent  = topic.id === currentTopicId
              const isMarking  = markingIds.has(topic.id)

              return (
                <div
                  key={topic.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '3px',
                    background: isCurrent ? hexToRgba(roadmapColor, 0.07) : 'transparent',
                    border: isCurrent
                      ? `1px solid ${hexToRgba(roadmapColor, 0.25)}`
                      : '1px solid transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'
                  }}
                  onMouseLeave={e => {
                    if (!isCurrent)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {/* Done / undone indicator */}
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: topic.is_done ? 'none' : '2px solid var(--border)',
                      background: topic.is_done ? roadmapColor : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '11px',
                      color: '#0f1115',
                      fontWeight: 700,
                    }}
                  >
                    {topic.is_done ? '✓' : ''}
                  </div>

                  {/* Category badge */}
                  <CategoryBadge cat={topic.category} />

                  {/* Title */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      color: topic.is_done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: topic.is_done ? 'line-through' : 'none',
                      minWidth: 0,
                    }}
                  >
                    {topic.title}
                  </span>

                  {/* Right side: done date OR mark-done button */}
                  {topic.is_done ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {topic.done_at ? fmtRelative(topic.done_at) : 'done'}
                    </span>
                  ) : (
                    <button
                      onClick={() => onMarkDone(topic.id, stage.id)}
                      disabled={isMarking}
                      title="Mark as done"
                      style={{
                        flexShrink: 0,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${roadmapColor}55`,
                        background: 'transparent',
                        color: roadmapColor,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: isMarking ? 'not-allowed' : 'pointer',
                        opacity: isMarking ? 0.5 : 1,
                        fontFamily: 'inherit',
                        transition: 'background 0.12s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        if (!isMarking)
                          (e.currentTarget as HTMLElement).style.background = hexToRgba(roadmapColor, 0.12)
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      {isMarking ? '…' : '✓ Done'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main RoadmapDetailClient ─────────────────────────────────────────────────

export default function RoadmapDetailClient({ roadmapId }: { roadmapId: string }) {
  const [roadmap, setRoadmap]               = useState<RoadmapRow | null>(null)
  const [stages, setStages]                 = useState<StageRow[]>([])
  const [topicsByStage, setTopicsByStage]   = useState<Record<string, TopicRow[]>>({})
  const [logEntries, setLogEntries]         = useState<Pick<LogEntryRow, 'date' | 'time_spent_minutes'>[]>([])
  const [loading, setLoading]               = useState(true)
  const [notFound, setNotFound]             = useState(false)

  // Which stage sections are expanded
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())

  // Topics being marked (show loading state)
  const [markingIds, setMarkingIds]         = useState<Set<string>>(new Set())

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [{ data: rm }, { data: st }, { data: le }] = await Promise.all([
      supabase.from('roadmaps').select('*').eq('id', roadmapId).single(),
      supabase.from('stages').select('*').eq('roadmap_id', roadmapId).order('order_index'),
      supabase
        .from('log_entries')
        .select('date, time_spent_minutes')
        .eq('roadmap_id', roadmapId)
        .gte('date', oneYearAgo.toISOString().slice(0, 10)),
    ])

    const roadmapData = rm as RoadmapRow | null
    const stageList   = (st ?? []) as StageRow[]

    if (!roadmapData) { setNotFound(true); setLoading(false); return }

    setRoadmap(roadmapData)
    setStages(stageList)
    setLogEntries((le ?? []) as Pick<LogEntryRow, 'date' | 'time_spent_minutes'>[])

    // Fetch topics for all stages
    if (stageList.length > 0) {
      const { data: tp } = await supabase
        .from('topics')
        .select('*')
        .in('stage_id', stageList.map(s => s.id))
        .order('order_index')

      const grouped: Record<string, TopicRow[]> = {}
      for (const t of (tp ?? []) as TopicRow[]) {
        if (!grouped[t.stage_id]) grouped[t.stage_id] = []
        grouped[t.stage_id].push(t)
      }
      setTopicsByStage(grouped)

      // Auto-expand the current stage
      const firstUndoneStage = stageList.find(s =>
        (grouped[s.id] ?? []).some(t => !t.is_done)
      )
      if (firstUndoneStage) {
        setExpandedStages(new Set([firstUndoneStage.id]))
      } else if (stageList.length > 0) {
        setExpandedStages(new Set([stageList[0].id]))
      }
    }

    setLoading(false)
  }, [roadmapId])

  useEffect(() => { load() }, [load])

  // ── Mark topic done ──────────────────────────────────────────────────────────

  const handleMarkDone = useCallback(
    async (topicId: string, stageId: string) => {
      if (!roadmap) return
      setMarkingIds(prev => new Set([...prev, topicId]))

      const now = new Date().toISOString()

      // Optimistic update: mark topic done in local state
      const updatedByStage: Record<string, TopicRow[]> = {}
      for (const [sid, tops] of Object.entries(topicsByStage)) {
        updatedByStage[sid] = tops.map(t =>
          t.id === topicId ? { ...t, is_done: true, done_at: now } : t
        )
      }
      setTopicsByStage(updatedByStage)

      // Find next undone topic
      const next = findNextUndone(topicId, stages, updatedByStage)

      // Update roadmap pointer
      const updatedRoadmap: RoadmapRow = {
        ...roadmap,
        current_stage_id: next?.stageId ?? null,
        current_topic_id: next?.topicId ?? null,
      }
      setRoadmap(updatedRoadmap)

      // Persist to Supabase
      await Promise.all([
        supabase.from('topics').update({ is_done: true, done_at: now } as any).eq('id', topicId),
        supabase
          .from('roadmaps')
          .update({
            current_stage_id: next?.stageId ?? null,
            current_topic_id: next?.topicId ?? null,
          } as any)
          .eq('id', roadmap.id),
      ])

      // If next topic is in a different stage, expand that stage
      if (next && next.stageId !== stageId) {
        setExpandedStages(prev => {
          const s = new Set(prev)
          s.add(next.stageId)
          return s
        })
      }

      setMarkingIds(prev => {
        const s = new Set(prev)
        s.delete(topicId)
        return s
      })
    },
    [roadmap, stages, topicsByStage]
  )

  const toggleStage = useCallback((stageId: string) => {
    setExpandedStages(prev => {
      const s = new Set(prev)
      s.has(stageId) ? s.delete(stageId) : s.add(stageId)
      return s
    })
  }, [])

  // ── Computed values ──────────────────────────────────────────────────────────

  const allTopics = Object.values(topicsByStage).flat()
  const totalDone   = allTopics.filter(t => t.is_done).length
  const totalTopics = allTopics.length
  const pct         = totalTopics === 0 ? 0 : (totalDone / totalTopics) * 100

  const logDates  = logEntries.map(e => e.date)
  const streak    = computeStreak(logDates)
  const totalTime = logEntries.reduce((sum, e) => sum + (e.time_spent_minutes ?? 0), 0)
  const heatmapCells: HeatmapCell[] = buildHeatmapCells(logDates)
  const weeklyBuckets: WeeklyBucket[] = computeWeeklyBuckets(logEntries)

  const currentPos = roadmap
    ? deriveCurrentPosition(roadmap, stages, topicsByStage)
    : null

  // ── States ───────────────────────────────────────────────────────────────────

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
            borderTopColor: roadmap?.color ?? 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading roadmap…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound || !roadmap) {
    return (
      <div style={{ padding: '40px 32px' }}>
        <p style={{ color: 'var(--danger)' }}>Roadmap not found.</p>
        <Link href="/" style={{ color: 'var(--accent)', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const color = roadmap.color

  const sectionTitle: React.CSSProperties = {
    margin: '0 0 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '20px 22px',
  }

  const statItem = (icon: string, value: string | number, label: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ fontSize: '18px', marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500, textAlign: 'center' }}>
        {label}
      </div>
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* ── Sticky top bar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '7px',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          ← Dashboard
        </Link>

        {/* Color bar */}
        <div style={{ width: '8px', height: '28px', borderRadius: '4px', background: color, flexShrink: 0 }} />

        <h1
          style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.3px',
          }}
        >
          {roadmap.name}
        </h1>

        {/* Log session button */}
        <Link
          href={`/log?roadmapId=${roadmap.id}${currentPos && currentPos !== 'complete' ? `&stageId=${currentPos.stage.id}&topicId=${currentPos.topic.id}` : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: color,
            color: '#0f1115',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          + Log Session
        </Link>
      </div>

      <div className="detail-wrapper">

        {/* ── Overall progress ──────────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '14px' }}>
            <span
              style={{ fontSize: '32px', fontWeight: 900, color, letterSpacing: '-1px' }}
            >
              {Math.round(pct)}%
            </span>
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              {totalDone} of {totalTopics} topics complete
            </span>
            {pct === 100 && totalTopics > 0 && (
              <span style={{ fontSize: '18px' }}>🎉</span>
            )}
          </div>
          <ProgressBar value={pct} color={color} height={8} />
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="detail-stats-row">
          {statItem('🔥', streak.current, 'day streak')}
          <div className="detail-stats-divider" />
          {statItem('🏆', streak.longest, 'longest streak')}
          <div className="detail-stats-divider" />
          {statItem('⏱', fmtMinutes(totalTime), 'total time')}
          <div className="detail-stats-divider" />
          {statItem('📝', logEntries.length, 'sessions')}
        </div>

        {/* ── Heatmap + Chart ───────────────────────────────────────────────── */}
        <div className="detail-grid">
          {/* Heatmap */}
          <div style={card}>
            <h2 style={sectionTitle}>Activity (this roadmap)</h2>
            <HeatmapGrid cells={heatmapCells} color={color} />
          </div>

          {/* Weekly bar chart */}
          <div style={card}>
            <h2 style={sectionTitle}>Time per week</h2>
            {logEntries.length === 0 ? (
              <div
                style={{
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                No sessions yet
              </div>
            ) : (
              <WeeklyBarChart buckets={weeklyBuckets} color={color} />
            )}
          </div>
        </div>

        {/* ── Resume here banner ────────────────────────────────────────────── */}
        {currentPos && currentPos !== 'complete' && (
          <div
            style={{
              ...card,
              marginBottom: '16px',
              border: `1px solid ${hexToRgba(color, 0.35)}`,
              background: hexToRgba(color, 0.05),
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: hexToRgba(color, 0.18),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              ▶
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '3px',
                }}
              >
                Resume here
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentPos.stage.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                → {currentPos.topic.title}
              </div>
            </div>
            <button
              onClick={() => handleMarkDone(currentPos.topic.id, currentPos.stage.id)}
              disabled={markingIds.has(currentPos.topic.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: color,
                color: '#0f1115',
                fontSize: '13px',
                fontWeight: 700,
                cursor: markingIds.has(currentPos.topic.id) ? 'not-allowed' : 'pointer',
                opacity: markingIds.has(currentPos.topic.id) ? 0.6 : 1,
                fontFamily: 'inherit',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {markingIds.has(currentPos.topic.id) ? '…' : '✓ Mark Done'}
            </button>
          </div>
        )}

        {currentPos === 'complete' && (
          <div
            style={{
              ...card,
              marginBottom: '16px',
              border: `1px solid ${hexToRgba(color, 0.35)}`,
              background: hexToRgba(color, 0.05),
              textAlign: 'center',
              padding: '28px',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color, marginBottom: '4px' }}>
              Roadmap Complete!
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              All {totalTopics} topics marked done. Excellent work.
            </div>
          </div>
        )}

        {/* ── Stage & Topic list ────────────────────────────────────────────── */}
        <div>
          <h2 style={{ ...sectionTitle, marginBottom: '12px' }}>
            Stages & Topics ({stages.length} stages · {totalTopics} topics)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stages.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--border)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                }}
              >
                No stages yet.{' '}
                <Link href="/admin" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  Add some in Admin →
                </Link>
              </div>
            ) : (
              [...stages]
                .sort((a, b) => a.order_index - b.order_index)
                .map(stage => (
                  <StageSection
                    key={stage.id}
                    stage={stage}
                    topics={topicsByStage[stage.id] ?? []}
                    roadmapColor={color}
                    isExpanded={expandedStages.has(stage.id)}
                    onToggle={() => toggleStage(stage.id)}
                    onMarkDone={handleMarkDone}
                    currentTopicId={
                      roadmap.current_topic_id ??
                      (currentPos && currentPos !== 'complete' ? currentPos.topic.id : null)
                    }
                    markingIds={markingIds}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
