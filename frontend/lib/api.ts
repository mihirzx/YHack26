const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const HEADERS: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json',
}

function get(url: string) {
  return fetch(url, { headers: HEADERS })
}

// ── Types ───────────────────────────────────────────────

export interface BackendEvent {
  event_id: string
  timestamp: string
  type: string
  expected?: string
  observed?: string
  corrected: boolean
  severity: string
}

export interface MedicationSetting {
  expected_color: string
}

export interface DashboardStats {
  total_events: number
  total_violations: number
  total_corrections: number
  total_escalations: number
  correction_rate: number
  type_counts: Record<string, number>
  severity_counts: Record<string, number>
  hourly_activity: Record<string, number>
  recent_events: BackendEvent[]
}

export interface PatientStats {
  patientId: string
  patientName: string
  totalEvents: number
  violations: number
  corrections: number
  correctionRate: number
  lastEvent: string
}

export interface HexAnalysisResult {
  summary: string
  trends: string[]
}

// ── API functions ───────────────────────────────────────

export async function fetchEvents(limit = 50): Promise<BackendEvent[]> {
  try {
    const response = await get(`${API_URL}/events?limit=${limit}`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchEvents failed:', err)
    return []
  }
}

export async function fetchStats(): Promise<DashboardStats | null> {
  try {
    const response = await get(`${API_URL}/stats`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchStats failed:', err)
    return null
  }
}

export async function fetchMedication(): Promise<MedicationSetting | null> {
  try {
    const response = await get(`${API_URL}/settings/medication`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchMedication failed:', err)
    return null
  }
}

export async function getPatientStats(): Promise<PatientStats[]> {
  try {
    const stats = await fetchStats()
    if (!stats) return []
    // Derive patient stats from aggregated event data
    return [{
      patientId: '1',
      patientName: 'Margaret',
      totalEvents: stats.total_events,
      violations: stats.total_violations,
      corrections: stats.total_corrections,
      correctionRate: stats.correction_rate,
      lastEvent: stats.recent_events[0]?.timestamp || 'N/A',
    }]
  } catch (err) {
    console.warn('[api] getPatientStats failed:', err)
    return []
  }
}

export async function getActiveAlerts(): Promise<BackendEvent[]> {
  try {
    const events = await fetchEvents(20)
    return events.filter(e => !e.corrected && e.severity !== 'low')
  } catch (err) {
    console.warn('[api] getActiveAlerts failed:', err)
    return []
  }
}

export async function saveMedication(color: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/settings/medication`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ expected_color: color }),
    })
    return response.ok
  } catch (err) {
    console.warn('[api] saveMedication failed:', err)
    return false
  }
}
