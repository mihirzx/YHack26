'use client'

import { useState, useEffect, useRef } from 'react'

type EventType = 'violation' | 'corrected'

interface LogEvent {
  id: string; type: EventType; title: string; description: string; time: string
}
interface Snapshot {
  id: string; type: EventType; label: string; time: string
}

const INITIAL_EVENTS: LogEvent[] = [
  { id: '1', type: 'corrected', title: 'Intervention Successful',    description: 'Patient corrected — put down blue pill, picked up red pill.', time: '12:38 PM' },
  { id: '2', type: 'violation', title: 'Unsafe Medication Detected', description: 'Patient picked blue pill — expected red. Alert sent.',           time: '12:37 PM' },
  { id: '3', type: 'corrected', title: 'Rule Check Passed',          description: 'Patient took red pill as instructed. No issues.',               time: '12:10 PM' },
]
const INITIAL_SNAPSHOTS: Snapshot[] = [
  { id: '1', type: 'corrected', label: 'Corrected', time: '12:38 PM · Room 1' },
  { id: '2', type: 'violation', label: 'Violation',  time: '12:37 PM · Room 1' },
  { id: '3', type: 'corrected', label: 'Corrected', time: '12:10 PM · Room 1' },
]
const VIOLATION_TYPES = [
  { title: 'Unsafe Medication Detected',       description: 'Patient picked orange pill — expected red.' },
  { title: 'Wrong Pill Color Observed',        description: 'Patient holding blue capsule. Rule: red pills only.' },
  { title: 'Non-Compliant Medication Attempt', description: 'Patient reached for green pill, expected red.' },
]

let counter = 0

export default function ActivityPage() {
  const [events,    setEvents]    = useState<LogEvent[]>(INITIAL_EVENTS)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS)
  const [clock,     setClock]     = useState('')
  const logRef                    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function simulateAlert() {
    const now  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const viol = VIOLATION_TYPES[counter % VIOLATION_TYPES.length]
    counter++
    setEvents(prev => [{ id: `evt-${Date.now()}`, type: 'violation', title: viol.title, description: viol.description, time: now }, ...prev])
    setSnapshots(prev => [{ id: `snap-${Date.now()}`, type: 'violation', label: 'Violation', time: `${now} · Room 1` }, ...prev])
    setTimeout(() => logRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  return (
    <div className="p-8">
      <header className="mb-7">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Activity — Room 1
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Margaret · Medication monitoring active</p>
      </header>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: 24 }}>

        {/* LEFT */}
        <div>
          <div className="overflow-hidden mb-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>

            {/* Feed */}
            <div
              className="relative flex items-center justify-center"
              style={{ height: 240, background: 'linear-gradient(135deg, #1E3A3A 0%, #2E6B6A 100%)' }}
              role="img" aria-label="Live camera feed for Room 1"
            >
              <span className="text-5xl opacity-30 text-white" aria-hidden="true">📷</span>
              <div className="absolute top-3 left-3 flex items-center gap-[5px] text-white text-[11px] font-bold px-[10px] py-1 rounded-full"
                style={{ background: 'rgba(76,175,138,0.9)' }}>
                <span className="w-[7px] h-[7px] rounded-full bg-white inline-block pulse" />
                LIVE
              </div>
              <div className="absolute top-3 right-3 text-[11px] px-[10px] py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.85)' }}>
                {clock}
              </div>
            </div>

            {/* Log header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-base font-bold" style={{ color: 'var(--cs-primary-dk)' }}>Event Log</span>
              <button onClick={simulateAlert} className="cs-btn-outline">+ Simulate Alert</button>
            </div>

            {/* Event log */}
            <div ref={logRef} aria-live="polite" aria-label="Event log"
              className="flex flex-col gap-[10px] px-4 pb-4 overflow-y-auto"
              style={{ maxHeight: 480 }}>
              {events.map((evt) => (
                <div key={evt.id} className={`cs-event-item slide-in ${evt.type === 'corrected' ? 'ok' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm" aria-hidden="true">{evt.type === 'corrected' ? '✅' : '⚠️'}</span>
                    <span className="text-[13px] font-bold flex-1"
                      style={{ color: evt.type === 'corrected' ? '#1a7a55' : '#b02020' }}>
                      {evt.title}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--cs-muted)' }}>{evt.time}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside aria-label="Notable snapshots">
          <h2 className="mb-4" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: 'var(--cs-primary-dk)' }}>
            Notable Snapshots
          </h2>
          <div className="flex flex-col gap-[10px] overflow-y-auto">
            {snapshots.map((snap) => (
              <div key={snap.id} className="flex gap-3 items-center p-[10px] slide-in"
                style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', borderRadius: 12, boxShadow: 'var(--cs-shadow)' }}>
                <div className="shrink-0 flex items-center justify-center text-xl rounded-lg"
                  style={{ width: 68, height: 48, background: snap.type === 'corrected' ? 'var(--cs-success-lt)' : 'var(--cs-alert-lt)' }}>
                  {snap.type === 'corrected' ? '✅' : '⚠️'}
                </div>
                <div>
                  <div className="text-xs font-bold mb-[2px]"
                    style={{ color: snap.type === 'corrected' ? '#1a7a55' : '#b02020' }}>
                    {snap.label}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--cs-muted)' }}>{snap.time}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}