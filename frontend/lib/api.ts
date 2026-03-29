import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
})

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

// ── API functions ───────────────────────────────────────

export async function fetchEvents(limit = 50): Promise<BackendEvent[]> {
  try {
    const { data } = await api.get<BackendEvent[]>('/events', { params: { limit } })
    return data
  } catch (err) {
    console.warn('[api] fetchEvents failed:', err)
    return []
  }
}

export async function fetchMedication(): Promise<MedicationSetting | null> {
  try {
    const { data } = await api.get<MedicationSetting>('/settings/medication')
    return data
  } catch (err) {
    console.warn('[api] fetchMedication failed:', err)
    return null
  }
}

export async function saveMedication(color: string): Promise<boolean> {
  try {
    await api.post('/settings/medication', { expected_color: color })
    return true
  } catch (err) {
    console.warn('[api] saveMedication failed:', err)
    return false
  }
}
