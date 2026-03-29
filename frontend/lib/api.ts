const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

// ── API functions ───────────────────────────────────────

export async function fetchEvents(limit = 50): Promise<BackendEvent[]> {
  try {
    const response = await fetch(`${API_URL}/events?limit=${limit}`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchEvents failed:', err)
    return []
  }
}

export async function fetchStats(): Promise<DashboardStats | null> {
  try {
    const response = await fetch(`${API_URL}/stats`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchStats failed:', err)
    return null
  }
}

export async function fetchMedication(): Promise<MedicationSetting | null> {
  try {
    const response = await fetch(`${API_URL}/settings/medication`)
    if (!response.ok) throw new Error(response.statusText)
    return await response.json()
  } catch (err) {
    console.warn('[api] fetchMedication failed:', err)
    return null
  }
}

export async function saveMedication(color: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/settings/medication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expected_color: color }),
    })
    return response.ok
  } catch (err) {
    console.warn('[api] saveMedication failed:', err)
    return false
  }
}
