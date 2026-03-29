export interface PatientProfile {
  id: string
  name: string
  age: number
  location: string
  careLevel: 'low' | 'moderate' | 'high' | 'critical'
  events: MonitoringEvent[]
}

export interface MonitoringEvent {
  id: string
  eventType: 'medication' | 'appliance' | 'mobility' | 'custom'
  timeStart: string
  timeEnd: string
  description: string
}

export const CARE_LEVEL_LABELS = {
  low: { label: 'Low', color: 'green' },
  moderate: { label: 'Moderate', color: 'teal' },
  high: { label: 'High', color: 'amber' },
  critical: { label: 'Critical', color: 'red' }
} as const

export const EVENT_TYPE_OPTIONS = [
  { id: 'medication', label: 'Daily Medication', emoji: '💊' },
  { id: 'appliance', label: 'Stove / Appliance', emoji: '🔥' },
  { id: 'mobility', label: 'Mobility Check', emoji: '🚶' },
  { id: 'custom', label: 'Custom', emoji: '✏️' }
] as const
