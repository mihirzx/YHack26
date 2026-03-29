'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchStats, fetchMedication, type DashboardStats } from '@/lib/api'
import { deriveRoomStatus } from '@/lib/transforms'

const STATUS_STYLE = {
  live:  { bg: 'rgba(76,175,138,0.9)',  dot: '#fff', label: 'LIVE' },
  alert: { bg: 'rgba(224,92,92,0.9)',   dot: '#fff', label: 'ALERT' },
  idle:  { bg: 'rgba(122,158,158,0.7)', dot: '#ccc', label: 'IDLE' },
} as const

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [status, setStatus] = useState<'live' | 'alert' | 'idle'>('idle')
  const [expectedColor, setExpectedColor] = useState('red')
  const [clock, setClock] = useState('')

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Poll stats
  useEffect(() => {
    let active = true
    async function poll() {
      const [s, med] = await Promise.all([fetchStats(), fetchMedication()])
      if (!active) return
      if (s) {
        setStats(s)
        setStatus(deriveRoomStatus(s.recent_events))
      }
      if (med) setExpectedColor(med.expected_color)
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { active = false; clearInterval(id) }
  }, [])

  const st = STATUS_STYLE[status]

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          Margaret · Room 1 · Expected medication: <strong style={{ color: 'var(--cs-primary)' }}>{expectedColor}</strong>
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

        {/* LEFT — Camera + Recent Events */}
        <div>
          {/* Camera Feed */}
          <div className="overflow-hidden mb-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
            <div
              className="relative flex items-center justify-center"
              style={{ height: 280, background: 'linear-gradient(135deg, #1E3A3A 0%, #2E6B6A 100%)' }}
              role="img" aria-label="Live camera feed"
            >
              <span className="text-6xl opacity-30 text-white" aria-hidden="true">📷</span>
              <div className="absolute top-3 left-3 flex items-center gap-[5px] text-white text-[11px] font-bold px-[10px] py-1 rounded-full"
                style={{ background: st.bg }}>
                <span className="w-[7px] h-[7px] rounded-full inline-block pulse" style={{ background: st.dot }} />
                {st.label}
              </div>
              <div className="absolute top-3 right-3 text-[11px] px-[10px] py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.85)' }}>
                {clock}
              </div>
              <div className="absolute bottom-3 left-3 text-[11px] px-[10px] py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.85)' }}>
                Room 1 · Margaret
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold" style={{ color: 'var(--cs-primary-dk)' }}>Recent Events</span>
              <Link href="/activity" className="text-xs font-semibold no-underline" style={{ color: 'var(--cs-primary)' }}>
                View all →
              </Link>
            </div>
            <div className="flex flex-col gap-[10px]">
              {stats?.recent_events.slice(0, 6).map((evt) => {
                const isOk = evt.type === 'corrected' || evt.type === 'correct_med_taken'
                let time = ''
                try {
                  const d = new Date(evt.timestamp)
                  time = isNaN(d.getTime())
                    ? new Date(parseFloat(evt.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } catch { time = '—' }
                return (
                  <div key={evt.event_id} className={`cs-event-item ${isOk ? 'ok' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{isOk ? '✅' : '⚠️'}</span>
                      <span className="text-[13px] font-bold flex-1" style={{ color: isOk ? '#1a7a55' : '#b02020' }}>
                        {evt.type === 'wrong_med_attempt' ? 'Wrong Medication' : evt.type === 'escalated' ? 'Escalated' : evt.type === 'corrected' ? 'Corrected' : evt.type}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--cs-muted)' }}>{time}</span>
                    </div>
                    {evt.expected && evt.observed && (
                      <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                        Expected: {evt.expected} · Observed: {evt.observed}
                      </p>
                    )}
                  </div>
                )
              })}
              {!stats && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--cs-muted)' }}>Loading events...</p>
              )}
              {stats && stats.recent_events.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--cs-muted)' }}>No events recorded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Stats Panel */}
        <aside>
          {/* Stat Cards */}
          <div className="flex flex-col gap-4 mb-5">
            <StatCard label="Total Events" value={stats?.total_events ?? '—'} />
            <StatCard label="Violations" value={stats?.total_violations ?? '—'} color="var(--cs-alert)" />
            <StatCard label="Corrections" value={stats?.total_corrections ?? '—'} color="var(--cs-success)" />
            <StatCard label="Correction Rate" value={stats ? `${stats.correction_rate}%` : '—'} color="var(--cs-primary)" />
            <StatCard label="Escalations" value={stats?.total_escalations ?? '—'} color="#b02020" />
          </div>

          {/* Severity Breakdown */}
          {stats && (
            <div className="p-4 mb-4" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
              <span className="text-[13px] font-bold block mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Severity Breakdown</span>
              {Object.entries(stats.severity_counts).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between py-1">
                  <span className="text-xs capitalize" style={{ color: 'var(--cs-ink)' }}>{severity}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ width: Math.min(count * 8, 100), height: 6, borderRadius: 3, background: severityColor(severity) }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--cs-muted)', minWidth: 20, textAlign: 'right' }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Event Types */}
          {stats && (
            <div className="p-4" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
              <span className="text-[13px] font-bold block mb-3" style={{ color: 'var(--cs-primary-dk)' }}>Event Types</span>
              {Object.entries(stats.type_counts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-1">
                  <span className="text-xs" style={{ color: 'var(--cs-ink)' }}>{typeLabel(type)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--cs-muted)' }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Link to full analytics */}
          <Link
            href="/analytics"
            className="block text-center mt-4 cs-btn-primary no-underline"
            style={{ fontSize: 13, padding: '10px 20px' }}
          >
            View Full Analytics
          </Link>
        </aside>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 flex items-center justify-between" style={{ background: 'var(--cs-surface)', borderRadius: 12, boxShadow: 'var(--cs-shadow)' }}>
      <span className="text-[13px]" style={{ color: 'var(--cs-muted)' }}>{label}</span>
      <span className="text-xl font-bold" style={{ color: color || 'var(--cs-primary-dk)' }}>{value}</span>
    </div>
  )
}

function severityColor(s: string): string {
  switch (s) {
    case 'low': return 'var(--cs-success)'
    case 'medium': return 'var(--cs-primary)'
    case 'high': return '#F0A030'
    case 'critical': return 'var(--cs-alert)'
    default: return 'var(--cs-muted)'
  }
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    wrong_med_attempt: 'Wrong Medication',
    corrected: 'Corrected',
    correct_med_taken: 'Correct Medication',
    escalated: 'Escalated',
    fall_detected: 'Fall',
    wandering_detected: 'Wandering',
    unsafe_activity: 'Unsafe Activity',
    no_activity: 'Inactivity',
  }
  return map[t] || t
}
