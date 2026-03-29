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
  const [events, setEvents] = useState<MonitoringEvent[]>([
    { id: '1', eventType: 'medication', timeStart: '08:00', timeEnd: '09:00', description: 'Patient should take the red pill from the left compartment' },
  ])

  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [eventType, setEventType] = useState<'medication' | 'appliance' | 'mobility' | 'custom'>('medication')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  const [ruleInput, setRuleInput] = useState('Patient should only take red pills.')
  const [activeRule, setActiveRule] = useState('Patient should only take red pills.')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'failed'>('idle')

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<BackendEvent[]>([])

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

  useEffect(() => {
    let active = true
    async function load() {
      const [s, a] = await Promise.all([fetchStats(), getActiveAlerts()])
      if (!active) return
      if (s) setStats(s)
      setAlerts(a)
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
    resetForm()
  }

  function resetForm() {
    setShowEventForm(false)
    setEditingEvent(null)
    setEventType('medication')
    setTimeStart('')
    setTimeEnd('')
    setEventDescription('')
  }

  return (
    <div className="p-8" style={{ maxWidth: 960, margin: '0 auto' }}>
      <header className="mb-8">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, color: 'var(--cs-primary-dk)' }}>
          Manage
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Margaret, 78 — Room 1</p>
      </header>

      {/* Medication Rule */}
      <section className="mb-8">
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Monitoring Rule</h2>
        <textarea
          rows={2}
          value={ruleInput}
          onChange={(e) => setRuleInput(e.target.value)}
          className="w-full text-sm mb-3"
          style={{ border: '1px solid var(--cs-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--cs-ink)', background: '#fff', fontFamily: 'Nunito, sans-serif', outline: 'none', resize: 'none' }}
        />
        <div className="flex items-center gap-3">
          <button onClick={saveRule} disabled={saving} className="text-sm font-semibold px-5 py-2 rounded-lg text-white" style={{ background: 'var(--cs-primary)', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveStatus === 'saved' && <span className="text-xs" style={{ color: 'var(--cs-success)' }}>Saved</span>}
          {saveStatus === 'failed' && <span className="text-xs" style={{ color: 'var(--cs-alert)' }}>Failed to save</span>}
        </div>
        {activeRule && (
          <p className="text-xs mt-3" style={{ color: 'var(--cs-muted)' }}>
            Active: <span style={{ color: 'var(--cs-ink)' }}>{activeRule}</span>
          </p>
        )}
      </section>

      {/* Scheduled Events */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: 'var(--cs-primary-dk)' }}>Scheduled Events</h2>
          <button onClick={() => setShowEventForm(true)} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ border: '1px solid var(--cs-border)', color: 'var(--cs-primary)' }}>
            Add
          </button>
        </div>

        {showEventForm && (
          <div className="mb-4 p-4 rounded-lg" style={{ border: '1px solid var(--cs-border)', background: '#fff' }}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {EVENT_TYPE_OPTIONS.map((t) => (
                <button key={t.id} type="button" onClick={() => setEventType(t.id as typeof eventType)}
                  className="text-xs px-3 py-1 rounded-lg"
                  style={{
                    border: eventType === t.id ? '1.5px solid var(--cs-primary)' : '1px solid var(--cs-border)',
                    color: eventType === t.id ? 'var(--cs-primary-dk)' : 'var(--cs-muted)',
                    background: '#fff',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <input type="text" value={timeStart} onChange={e => setTimeStart(e.target.value)} placeholder="08:00"
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--cs-border)', outline: 'none', color: 'var(--cs-ink)' }} />
              <span className="text-sm self-center" style={{ color: 'var(--cs-muted)' }}>to</span>
              <input type="text" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} placeholder="09:00"
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ border: '1px solid var(--cs-border)', outline: 'none', color: 'var(--cs-ink)' }} />
            </div>
            <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="What should be monitored?" rows={2}
              className="w-full text-sm mb-3 px-3 py-2 rounded-lg" style={{ border: '1px solid var(--cs-border)', outline: 'none', resize: 'none', color: 'var(--cs-ink)' }} />
            <div className="flex gap-2">
              <button onClick={handleAddEvent} disabled={!timeStart || !timeEnd || !eventDescription}
                className="text-xs font-semibold px-4 py-2 rounded-lg text-white" style={{ background: 'var(--cs-primary)', opacity: (!timeStart || !timeEnd || !eventDescription) ? 0.5 : 1 }}>
                {editingEvent ? 'Update' : 'Add'}
              </button>
              <button onClick={resetForm} className="text-xs px-4 py-2 rounded-lg" style={{ color: 'var(--cs-muted)' }}>Cancel</button>
            </div>
          </div>
        )}

        {events.map((event) => {
          const cfg = EVENT_TYPE_OPTIONS.find(t => t.id === event.eventType)
          return (
            <div key={event.id} className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid var(--cs-border)' }}>
              <div>
                <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{event.description}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{cfg?.label} — {event.timeStart} to {event.timeEnd}</p>
              </div>
              <div className="flex gap-3 shrink-0 ml-4">
                <button onClick={() => { setEventType(event.eventType); setTimeStart(event.timeStart); setTimeEnd(event.timeEnd); setEventDescription(event.description); setEditingEvent(event.id); setShowEventForm(true) }}
                  className="text-xs" style={{ color: 'var(--cs-primary)' }}>Edit</button>
                <button onClick={() => setEvents(events.filter(e => e.id !== event.id))}
                  className="text-xs" style={{ color: 'var(--cs-alert)' }}>Remove</button>
              </div>
            </div>
          )
        })}
        {events.length === 0 && <p className="text-xs py-4" style={{ color: 'var(--cs-muted)' }}>No events scheduled</p>}
      </section>

      {/* Stats Summary */}
      {stats && (
        <section>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Summary</h2>
          <div className="flex gap-6 mb-4">
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{stats.total_events}</span>
              <span className="text-xs block" style={{ color: 'var(--cs-muted)' }}>events</span>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--cs-alert)' }}>{stats.total_violations}</span>
              <span className="text-xs block" style={{ color: 'var(--cs-muted)' }}>violations</span>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--cs-success)' }}>{stats.total_corrections}</span>
              <span className="text-xs block" style={{ color: 'var(--cs-muted)' }}>corrections</span>
            </div>
            <div>
              <span className="text-2xl font-bold" style={{ color: 'var(--cs-primary)' }}>{stats.correction_rate}%</span>
              <span className="text-xs block" style={{ color: 'var(--cs-muted)' }}>correction rate</span>
            </div>
          </div>

          {alerts.length > 0 && (
            <>
              <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--cs-primary-dk)' }}>Active Alerts</h2>
              {alerts.slice(0, 3).map(a => {
                let time = ''
                try { time = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch {}
                return (
                  <div key={a.event_id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--cs-border)' }}>
                    <span className="text-sm" style={{ color: 'var(--cs-alert)' }}>{a.type === 'wrong_med_attempt' ? 'Wrong medication' : a.type === 'escalated' ? 'Escalated' : a.type}</span>
                    <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{time}</span>
                  </div>
                )
              })}
            </>
          )}
        </section>
      )}
    </div>
  )
}
