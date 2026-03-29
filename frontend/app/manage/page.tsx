'use client'

import { useState, useEffect } from 'react'
import { fetchMedication, saveMedication, fetchStats, getActiveAlerts, type DashboardStats, type BackendEvent } from '@/lib/api'
import { EVENT_TYPE_OPTIONS } from '@/lib/types'
import type { MonitoringEvent } from '@/lib/types'

const KNOWN_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'white', 'purple', 'pink']

function extractColor(text: string): string | null {
  const lower = text.toLowerCase()
  for (const color of KNOWN_COLORS) {
    if (lower.includes(color)) return color
  }
  return null
}

export default function ManagePage() {
  // Margaret's monitoring events (local state for demo)
  const [events, setEvents] = useState<MonitoringEvent[]>([
    {
      id: '1',
      eventType: 'medication',
      timeStart: '08:00',
      timeEnd: '09:00',
      description: 'Patient should take the red pill from the left compartment',
    },
  ])

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [eventType, setEventType] = useState<'medication' | 'appliance' | 'mobility' | 'custom'>('medication')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  // Medication rule
  const [ruleInput, setRuleInput] = useState('Patient should only take red pills.')
  const [activeRule, setActiveRule] = useState('Patient should only take red pills.')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'failed'>('idle')

  // Analytics from backend
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<BackendEvent[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Load medication setting
  useEffect(() => {
    async function load() {
      const med = await fetchMedication()
      if (med?.expected_color) {
        const rule = `Patient should only take ${med.expected_color} pills.`
        setRuleInput(rule)
        setActiveRule(rule)
      }
    }
    load()
  }, [])

  // Load stats + alerts
  useEffect(() => {
    let active = true
    async function load() {
      const [s, a] = await Promise.all([fetchStats(), getActiveAlerts()])
      if (!active) return
      setStats(s)
      setAlerts(a)
      setLoadingStats(false)
    }
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [])

  async function saveRule() {
    const trimmed = ruleInput.trim()
    if (!trimmed) return
    setActiveRule(trimmed)
    const color = extractColor(trimmed)
    if (color) {
      setSaving(true)
      setSaveStatus('idle')
      const ok = await saveMedication(color)
      setSaving(false)
      setSaveStatus(ok ? 'saved' : 'failed')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  function handleAddEvent() {
    if (!eventType || !timeStart || !timeEnd || !eventDescription) return
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent ? { ...e, eventType, timeStart, timeEnd, description: eventDescription } : e))
      setEditingEvent(null)
    } else {
      setEvents([...events, { id: Date.now().toString(), eventType, timeStart, timeEnd, description: eventDescription }])
    }
    resetEventForm()
  }

  function handleEditEvent(event: MonitoringEvent) {
    setEventType(event.eventType)
    setTimeStart(event.timeStart)
    setTimeEnd(event.timeEnd)
    setEventDescription(event.description)
    setEditingEvent(event.id)
    setShowEventForm(true)
  }

  function resetEventForm() {
    setShowEventForm(false)
    setEditingEvent(null)
    setEventType('medication')
    setTimeStart('')
    setTimeEnd('')
    setEventDescription('')
  }

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Patient Management
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          Margaret · Room 1 · Powered by Hex API
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT — Patient Profile + Events */}
        <div>
          {/* Patient Card */}
          <div className="p-5 mb-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold" style={{ color: 'var(--cs-ink)' }}>Margaret</h2>
                <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: '#F0A03020', color: '#F0A030' }}>
                  HIGH
                </span>
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--cs-muted)' }}>78 · Room 1 · {events.length} monitoring event{events.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Medication Rule */}
          <div className="p-5 mb-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
            <label className="block text-[13px] font-bold mb-2" style={{ color: 'var(--cs-primary-dk)' }}>
              Monitoring Rule
            </label>
            <textarea
              rows={3}
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              placeholder="e.g. Patient should only take the red pill."
              className="w-full text-sm mb-3 resize-y"
              style={{
                border: '1.5px solid var(--cs-border)', borderRadius: 12, padding: '12px 16px',
                color: 'var(--cs-ink)', background: 'var(--cs-surface)', fontFamily: 'Nunito, sans-serif', outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--cs-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--cs-border)')}
            />
            <div className="flex items-center gap-3">
              <button onClick={saveRule} disabled={saving} className="cs-btn-primary" style={{ fontSize: 13, padding: '8px 24px', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Rule'}
              </button>
              {saveStatus === 'saved' && <span className="text-xs font-semibold" style={{ color: 'var(--cs-success)' }}>Saved to backend</span>}
              {saveStatus === 'failed' && <span className="text-xs font-semibold" style={{ color: 'var(--cs-alert)' }}>Could not reach backend</span>}
            </div>
            {activeRule && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cs-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-[6px] h-[6px] rounded-full pulse" style={{ background: 'var(--cs-success)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--cs-success)' }}>Active</span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--cs-ink)' }}>{activeRule}</p>
              </div>
            )}
          </div>

          {/* Monitoring Events */}
          <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-bold" style={{ color: 'var(--cs-primary-dk)' }}>Monitoring Events</span>
              <button onClick={() => setShowEventForm(true)} className="cs-btn-outline" style={{ fontSize: 12, padding: '6px 16px' }}>+ Add Event</button>
            </div>

            {showEventForm && (
              <div className="mb-4 p-4" style={{ background: 'var(--cs-accent)', borderRadius: 12 }}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {EVENT_TYPE_OPTIONS.map((t) => (
                    <button key={t.id} type="button" onClick={() => setEventType(t.id as typeof eventType)}
                      className="p-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      style={{
                        border: eventType === t.id ? '2px solid var(--cs-primary)' : '1px solid var(--cs-border)',
                        background: eventType === t.id ? 'var(--cs-accent)' : 'var(--cs-surface)',
                        color: 'var(--cs-ink)',
                      }}>
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-3">
                  <input type="text" value={timeStart} onChange={e => setTimeStart(e.target.value)} placeholder="08:00"
                    className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--cs-border)', background: 'var(--cs-surface)', color: 'var(--cs-ink)', outline: 'none' }} />
                  <input type="text" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} placeholder="09:00"
                    className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--cs-border)', background: 'var(--cs-surface)', color: 'var(--cs-ink)', outline: 'none' }} />
                </div>
                <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="Description..." rows={2}
                  className="w-full text-sm mb-3 px-3 py-2 rounded-lg resize-none" style={{ border: '1px solid var(--cs-border)', background: 'var(--cs-surface)', color: 'var(--cs-ink)', outline: 'none' }} />
                <div className="flex gap-2">
                  <button onClick={handleAddEvent} disabled={!timeStart || !timeEnd || !eventDescription}
                    className="flex-1 py-2 text-sm font-bold rounded-full text-white" style={{ background: 'var(--cs-primary)', opacity: (!timeStart || !timeEnd || !eventDescription) ? 0.5 : 1 }}>
                    {editingEvent ? 'Update' : 'Add'}
                  </button>
                  <button onClick={resetEventForm} className="flex-1 py-2 text-sm font-bold rounded-full" style={{ border: '1px solid var(--cs-border)', color: 'var(--cs-ink)' }}>Cancel</button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {events.map((event) => {
                const cfg = EVENT_TYPE_OPTIONS.find(t => t.id === event.eventType)
                return (
                  <div key={event.id} className="p-3" style={{ background: 'var(--cs-surface-alt, #F7FAF9)', border: '1px solid var(--cs-border)', borderRadius: 10 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--cs-primary-dk)' }}>
                        {cfg?.emoji} {cfg?.label} · {event.timeStart} - {event.timeEnd}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditEvent(event)} className="text-[11px] font-medium" style={{ color: 'var(--cs-primary)' }}>Edit</button>
                        <button onClick={() => setEvents(events.filter(e => e.id !== event.id))} className="text-[11px] font-medium" style={{ color: 'var(--cs-alert)' }}>Remove</button>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cs-ink)' }}>{event.description}</p>
                  </div>
                )
              })}
              {events.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--cs-muted)' }}>No monitoring events</p>}
            </div>
          </div>
        </div>

        {/* RIGHT — Analytics from Hex/MongoDB */}
        <div>
          {loadingStats ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--cs-muted)' }}>Loading analytics...</p>
          ) : stats ? (
            <div className="flex flex-col gap-4">
              {/* Overview Stats */}
              <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
                <span className="text-[13px] font-bold block mb-4" style={{ color: 'var(--cs-primary-dk)' }}>Patient Overview</span>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Total Events" value={stats.total_events} />
                  <MiniStat label="Violations" value={stats.total_violations} color="var(--cs-alert)" />
                  <MiniStat label="Corrections" value={stats.total_corrections} color="var(--cs-success)" />
                  <MiniStat label="Correction Rate" value={`${stats.correction_rate}%`} color="var(--cs-primary)" />
                </div>
              </div>

              {/* Severity Breakdown */}
              <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
                <span className="text-[13px] font-bold block mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Severity Breakdown</span>
                {['low', 'medium', 'high', 'critical'].map(sev => {
                  const count = stats.severity_counts[sev] || 0
                  const pct = stats.total_events > 0 ? (count / stats.total_events) * 100 : 0
                  return (
                    <div key={sev} className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs capitalize font-semibold" style={{ color: 'var(--cs-ink)' }}>{sev}</span>
                        <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--cs-accent)' }}>
                        <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: sevColor(sev), transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Event Types */}
              <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
                <span className="text-[13px] font-bold block mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Event Types</span>
                {Object.entries(stats.type_counts).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                  <div key={type} className="flex justify-between py-1">
                    <span className="text-xs" style={{ color: 'var(--cs-ink)' }}>{typeLabel(type)}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--cs-muted)' }}>{count}</span>
                  </div>
                ))}
              </div>

              {/* Active Alerts */}
              {alerts.length > 0 && (
                <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
                  <span className="text-[13px] font-bold block mb-3" style={{ color: 'var(--cs-primary-dk)' }}>
                    Active Alerts ({alerts.length})
                  </span>
                  <div className="flex flex-col gap-2">
                    {alerts.slice(0, 5).map(a => {
                      let time = ''
                      try { time = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch {}
                      return (
                        <div key={a.event_id} className="p-2 rounded text-xs" style={{ background: 'var(--cs-alert-lt)', borderLeft: '3px solid var(--cs-alert)' }}>
                          <span className="font-semibold" style={{ color: 'var(--cs-alert)' }}>{typeLabel(a.type)}</span>
                          <span className="ml-2" style={{ color: 'var(--cs-muted)' }}>{time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--cs-muted)' }}>No analytics data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center p-3 rounded-lg" style={{ background: 'var(--cs-accent)' }}>
      <div className="text-lg font-bold" style={{ color: color || 'var(--cs-primary-dk)' }}>{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>{label}</div>
    </div>
  )
}

function sevColor(s: string): string {
  switch (s) { case 'low': return '#4CAF8A'; case 'medium': return '#5BBFBE'; case 'high': return '#F0A030'; case 'critical': return '#E05C5C'; default: return '#7A9E9E' }
}

function typeLabel(t: string): string {
  const m: Record<string, string> = { wrong_med_attempt: 'Wrong Medication', corrected: 'Corrected', correct_med_taken: 'Correct Medication', escalated: 'Escalated', fall_detected: 'Fall', wandering_detected: 'Wandering', unsafe_activity: 'Unsafe Activity', no_activity: 'Inactivity' }
  return m[t] || t
}
