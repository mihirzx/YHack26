'use client'

import { useState, useEffect } from 'react'
import { fetchStats, type DashboardStats } from '@/lib/api'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      const s = await fetchStats()
      if (!active) return
      setStats(s)
      setLoading(false)
    }
    load()
    const id = setInterval(load, 15000)
    return () => { active = false; clearInterval(id) }
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-4" style={{ color: 'var(--cs-muted)' }}>Loading data from MongoDB...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-4 px-4 py-3 rounded-lg inline-block" style={{ background: '#FEF3CD', color: '#856404' }}>
          Backend unreachable — cannot load analytics
        </p>
      </div>
    )
  }

  const maxHourly = Math.max(...Object.values(stats.hourly_activity), 1)

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          Powered by Hex API · Data from MongoDB · Auto-refreshes every 15s
        </p>
      </header>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }} className="mb-7">
        <BigStat label="Total Events" value={stats.total_events} />
        <BigStat label="Violations" value={stats.total_violations} color="var(--cs-alert)" />
        <BigStat label="Corrections" value={stats.total_corrections} color="var(--cs-success)" />
        <BigStat label="Escalations" value={stats.total_escalations} color="#b02020" />
        <BigStat label="Correction Rate" value={`${stats.correction_rate}%`} color="var(--cs-primary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Hourly Activity (bar chart) */}
        <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
          <span className="text-[13px] font-bold block mb-4" style={{ color: 'var(--cs-primary-dk)' }}>
            24-Hour Activity
          </span>
          <div className="flex items-end gap-[3px]" style={{ height: 140 }}>
            {Array.from({ length: 24 }, (_, h) => {
              const count = stats.hourly_activity[h] || 0
              const height = count > 0 ? Math.max((count / maxHourly) * 120, 4) : 2
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    style={{
                      height,
                      width: '100%',
                      borderRadius: 3,
                      background: count > 0 ? 'var(--cs-primary)' : 'var(--cs-border)',
                      transition: 'height 0.3s',
                    }}
                    title={`${h}:00 — ${count} event${count !== 1 ? 's' : ''}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>12 AM</span>
            <span className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>6 AM</span>
            <span className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>12 PM</span>
            <span className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>6 PM</span>
            <span className="text-[10px]" style={{ color: 'var(--cs-muted)' }}>11 PM</span>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
          <span className="text-[13px] font-bold block mb-4" style={{ color: 'var(--cs-primary-dk)' }}>
            Severity Distribution
          </span>
          <div className="flex flex-col gap-3">
            {['low', 'medium', 'high', 'critical'].map((severity) => {
              const count = stats.severity_counts[severity] || 0
              const pct = stats.total_events > 0 ? (count / stats.total_events) * 100 : 0
              return (
                <div key={severity}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold capitalize" style={{ color: 'var(--cs-ink)' }}>{severity}</span>
                    <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--cs-accent)' }}>
                    <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: severityColor(severity), transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
          <span className="text-[13px] font-bold block mb-4" style={{ color: 'var(--cs-primary-dk)' }}>
            Event Types
          </span>
          <div className="flex flex-col gap-2">
            {Object.entries(stats.type_counts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const pct = stats.total_events > 0 ? (count / stats.total_events) * 100 : 0
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-lg">{typeEmoji(type)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--cs-ink)' }}>{typeLabel(type)}</span>
                        <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--cs-accent)' }}>
                        <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: 'var(--cs-primary)', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Recent Events Log */}
        <div className="p-5" style={{ background: 'var(--cs-surface)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
          <span className="text-[13px] font-bold block mb-4" style={{ color: 'var(--cs-primary-dk)' }}>
            Latest Events
          </span>
          <div className="flex flex-col gap-[10px] overflow-y-auto" style={{ maxHeight: 320 }}>
            {stats.recent_events.map((evt) => {
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
                    <span className="text-[12px] font-bold flex-1" style={{ color: isOk ? '#1a7a55' : '#b02020' }}>
                      {typeLabel(evt.type)}
                    </span>
                    <span className="text-[11px] px-2 py-[2px] rounded-full" style={{
                      background: severityColor(evt.severity) + '20',
                      color: severityColor(evt.severity),
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      {evt.severity}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--cs-muted)' }}>{time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function BigStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-4 text-center" style={{ background: 'var(--cs-surface)', borderRadius: 12, boxShadow: 'var(--cs-shadow)' }}>
      <div className="text-2xl font-bold mb-1" style={{ color: color || 'var(--cs-primary-dk)' }}>{value}</div>
      <div className="text-[11px]" style={{ color: 'var(--cs-muted)' }}>{label}</div>
    </div>
  )
}

function severityColor(s: string): string {
  switch (s) {
    case 'low': return '#4CAF8A'
    case 'medium': return '#5BBFBE'
    case 'high': return '#F0A030'
    case 'critical': return '#E05C5C'
    default: return '#7A9E9E'
  }
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    wrong_med_attempt: 'Wrong Medication',
    corrected: 'Corrected',
    correct_med_taken: 'Correct Medication',
    escalated: 'Escalated',
    fall_detected: 'Fall Detected',
    wandering_detected: 'Wandering',
    unsafe_activity: 'Unsafe Activity',
    no_activity: 'Inactivity',
  }
  return map[t] || t
}

function typeEmoji(t: string): string {
  const map: Record<string, string> = {
    wrong_med_attempt: '💊',
    corrected: '✅',
    correct_med_taken: '💊',
    escalated: '🚨',
    fall_detected: '🚶',
    wandering_detected: '🚪',
    unsafe_activity: '🔥',
    no_activity: '💤',
  }
  return map[t] || '📋'
}
