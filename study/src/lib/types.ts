// ─── Auto-generated TypeScript types matching the Supabase DB schema ───────
// These mirror the tables defined in /skills/02-backend.md exactly.
// Update whenever migrations add/remove columns.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Raw DB row shapes ──────────────────────────────────────────────────────

export interface RoadmapRow {
  id: string                   // uuid
  name: string
  color: string                // hex code or palette key
  description: string | null
  current_stage_id: string | null  // FK → stages.id
  current_topic_id: string | null  // FK → topics.id
  created_at: string           // timestamptz ISO string
}

export interface StageRow {
  id: string                   // uuid
  roadmap_id: string           // FK → roadmaps.id
  title: string
  order_index: number
  timeframe_label: string | null  // display-only, e.g. "Week 1–3"
  created_at: string
}

export interface TopicRow {
  id: string                   // uuid
  stage_id: string             // FK → stages.id
  title: string
  category: string | null      // "theory" | "practical" | other free-form
  order_index: number
  is_done: boolean
  done_at: string | null       // timestamptz ISO string, set when marked done
}

export interface LogEntryRow {
  id: string                   // uuid
  roadmap_id: string           // FK → roadmaps.id
  stage_id: string | null      // FK → stages.id
  topic_id: string | null      // FK → topics.id
  date: string                 // ISO date string "YYYY-MM-DD"
  time_spent_minutes: number
  commit_link: string | null   // URL
  note: string | null
  created_at: string
}

export interface PlannedSessionRow {
  id: string                   // uuid
  roadmap_id: string           // FK → roadmaps.id
  stage_id: string | null      // FK → stages.id
  topic_id: string | null      // FK → topics.id
  date: string                 // ISO date string "YYYY-MM-DD"
  start_time: string | null    // "HH:MM:SS" time string
  end_time: string | null      // "HH:MM:SS" time string
  is_complete: boolean
  notify_at: string | null     // timestamptz — reserved for future notification bot
  created_at: string
}

// ── Supabase Database type (used by createClient<Database>) ───────────────

export type Database = {
  public: {
    Tables: {
      roadmaps: {
        Row: RoadmapRow
        Insert: Omit<RoadmapRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<RoadmapRow, 'id' | 'created_at'>>
      }
      stages: {
        Row: StageRow
        Insert: Omit<StageRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<StageRow, 'id' | 'created_at'>>
      }
      topics: {
        Row: TopicRow
        Insert: Omit<TopicRow, 'id'> & { id?: string }
        Update: Partial<Omit<TopicRow, 'id'>>
      }
      log_entries: {
        Row: LogEntryRow
        Insert: Omit<LogEntryRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<LogEntryRow, 'id' | 'created_at'>>
      }
      planned_sessions: {
        Row: PlannedSessionRow
        Insert: Omit<PlannedSessionRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PlannedSessionRow, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Convenience joined/extended types used by the UI ──────────────────────

/** Stage with its topics nested in */
export interface StageWithTopics extends StageRow {
  topics: TopicRow[]
}

/** Roadmap with its stages (and topics) nested in */
export interface RoadmapWithStages extends RoadmapRow {
  stages: StageWithTopics[]
}

/** Log entry with joined roadmap/stage/topic names (for history table) */
export interface LogEntryWithNames extends LogEntryRow {
  roadmap_name?: string
  roadmap_color?: string
  stage_title?: string
  topic_title?: string
}

/** Planned session with joined names */
export interface PlannedSessionWithNames extends PlannedSessionRow {
  roadmap_name?: string
  roadmap_color?: string
  stage_title?: string
  topic_title?: string
}
