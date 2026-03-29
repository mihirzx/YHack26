import type { BackendEvent } from './api'

// ── Frontend display types (match existing page interfaces) ─────

export interface LogEvent {
  id: string
  type: 'violation' | 'corrected'
  title: string
  description: string
  time: string
}

export interface Snapshot {
  id: string
  type: 'violation' | 'corrected'
  label: string
  time: string
}

// ── Title / description maps ────────────────────────────────────

const TITLE_MAP: Record<string, string> = {
  wrong_med_attempt: 'Unsafe Medication Detected',
  escalated: 'Alert Escalated',
  corrected: 'Intervention Successful',
  correct_med_taken: 'Rule Check Passed',
  fall_detected: 'Fall Detected',
  wandering_detected: 'Wandering Detected',
  unsafe_activity: 'Unsafe Activity',
  no_activity: 'Inactivity Detected',
}

function describeEvent(e: BackendEvent): string {
  switch (e.type) {
    case 'wrong_med_attempt':
      return `Patient picked ${e.observed || 'unknown'} pill — expected ${e.expected || 'unknown'}. Alert sent.`
    case 'escalated':
      return `Patient did not correct after warning. Expected ${e.expected || 'unknown'}, still holding ${e.observed || 'unknown'}.`
    case 'corrected':
      return `Patient corrected — put down ${e.observed || 'wrong'} pill, picked up ${e.expected || 'correct'} pill.`
    case 'correct_med_taken':
      return `Patient took ${e.observed || e.expected || 'correct'} pill as instructed. No issues.`
    case 'fall_detected':
      return 'Patient fall detected. Emergency alert sent.'
    case 'wandering_detected':
      return 'Patient left safe zone. Caregiver notified.'
    default:
      return `Event: ${e.type}`
  }
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) {
      // timestamp might be a unix float from logic/events.py
      const asNum = parseFloat(timestamp)
      if (!isNaN(asNum)) {
        return new Date(asNum * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      return timestamp
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return timestamp
  }
}

// ── Transforms ──────────────────────────────────────────────────

export function backendToFrontend(e: BackendEvent): LogEvent {
  const isCorrection = e.type === 'corrected' || e.type === 'correct_med_taken'
  return {
    id: e.event_id,
    type: isCorrection ? 'corrected' : 'violation',
    title: TITLE_MAP[e.type] || 'Activity Detected',
    description: describeEvent(e),
    time: formatTime(e.timestamp),
  }
}

export function backendToSnapshot(e: BackendEvent): Snapshot {
  const isCorrection = e.type === 'corrected' || e.type === 'correct_med_taken'
  return {
    id: e.event_id,
    type: isCorrection ? 'corrected' : 'violation',
    label: isCorrection ? 'Corrected' : 'Violation',
    time: `${formatTime(e.timestamp)} · Room 1`,
  }
}

export function deriveRoomStatus(events: BackendEvent[]): 'live' | 'alert' | 'idle' {
  if (events.length === 0) return 'idle'

  const fiveMinAgo = Date.now() - 5 * 60 * 1000
  const tenMinAgo = Date.now() - 10 * 60 * 1000

  const recentEvents = events.filter(e => {
    const t = new Date(e.timestamp).getTime() || parseFloat(e.timestamp) * 1000
    return t > tenMinAgo
  })

  if (recentEvents.length === 0) return 'idle'

  const hasRecentAlert = recentEvents.some(e => {
    const t = new Date(e.timestamp).getTime() || parseFloat(e.timestamp) * 1000
    return t > fiveMinAgo && !e.corrected && e.severity !== 'low'
  })

  return hasRecentAlert ? 'alert' : 'live'
}

export function countAlerts(events: BackendEvent[]): number {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()

  return events.filter(e => {
    const t = new Date(e.timestamp).getTime() || parseFloat(e.timestamp) * 1000
    return t > todayMs && e.type !== 'corrected' && e.type !== 'correct_med_taken'
  }).length
}

export function lastViewedLabel(events: BackendEvent[]): string {
  if (events.length === 0) return 'no data'
  const latest = events[0]
  const t = new Date(latest.timestamp).getTime() || parseFloat(latest.timestamp) * 1000
  const diffMin = Math.floor((Date.now() - t) / 60000)
  if (diffMin < 1) return 'now'
  if (diffMin === 1) return '1 min ago'
  return `${diffMin} min ago`
}
