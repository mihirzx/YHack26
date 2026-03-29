'use client'

import { useState, useEffect } from 'react'
import { fetchMedication, saveMedication } from '@/lib/api'

const PILL_COLORS = ['#e05c5c','#e05c5c','#4CAF8A','#e05c5c','#5B8FBF','#e05c5c','#F0A030','#e05c5c']
const KNOWN_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'white', 'purple', 'pink']
const DEFAULT_RULE = 'Patient should only take red pills.'

function extractColor(text: string): string | null {
  const lower = text.toLowerCase()
  for (const color of KNOWN_COLORS) {
    if (lower.includes(color)) return color
  }
  return null
}

export default function ManagePage() {
  const [ruleInput,     setRuleInput]     = useState(DEFAULT_RULE)
  const [activeRule,    setActiveRule]     = useState(DEFAULT_RULE)
  const [lastTriggered, setLastTriggered] = useState('4 minutes ago')
  const [saving,        setSaving]        = useState(false)
  const [saveStatus,    setSaveStatus]    = useState<'idle' | 'saved' | 'failed'>('idle')

  // Load current medication setting from backend on mount
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

  async function saveRule() {
    const trimmed = ruleInput.trim()
    if (!trimmed) return

    // Update local state immediately (responsive UI)
    setActiveRule(trimmed)
    setLastTriggered('just now')

    // Extract color and save to backend
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

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}>
          Monitoring Rules
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          Define what the AI should watch for in each camera feed.
        </p>
      </header>

      <div style={{ maxWidth: 680 }}>
        {/* Info callout */}
        <div
          className="text-sm leading-relaxed mb-7 px-[18px] py-[14px]"
          style={{
            background: 'var(--cs-accent)',
            borderLeft: '3px solid var(--cs-primary)',
            borderRadius: '0 12px 12px 0',
            color: 'var(--cs-primary-dk)',
          }}
        >
          💡 The AI watches the live feed and compares what it observes to your rule. When a patient's action doesn't match — like grabbing the wrong pill — you're alerted instantly.
        </div>

        {/* Pill preview */}
        <div
          aria-label="Pill organizer preview"
          className="w-full flex items-center justify-center mb-6"
          style={{
            height: 220,
            borderRadius: 16,
            border: '2px dashed var(--cs-border)',
            background: 'linear-gradient(135deg, #f5f0e8 0%, #ede8dc 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            {PILL_COLORS.map((color, i) => (
              <div
                key={i}
                style={{ width: 28, height: 14, borderRadius: 7, border: '2px solid rgba(0,0,0,0.1)', background: color }}
              />
            ))}
          </div>
        </div>

        {/* Rule textarea */}
        <label htmlFor="rule-input" className="block text-[13px] font-bold mb-2" style={{ color: 'var(--cs-primary-dk)' }}>
          Monitoring Rule
        </label>
        <textarea
          id="rule-input"
          rows={4}
          value={ruleInput}
          onChange={(e) => setRuleInput(e.target.value)}
          placeholder="e.g. Patient should only take the red pill."
          className="w-full text-sm mb-4 resize-y"
          style={{
            border: '1.5px solid var(--cs-border)',
            borderRadius: 12,
            padding: '12px 16px',
            color: 'var(--cs-ink)',
            background: 'var(--cs-surface)',
            minHeight: 80,
            fontFamily: 'Nunito, sans-serif',
            outline: 'none',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--cs-primary)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--cs-border)')}
        />

        <div className="flex items-center gap-3 mb-7">
          <button onClick={saveRule} disabled={saving} className="cs-btn-primary block" style={{ fontSize: 14, padding: '10px 28px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save Rule'}
          </button>
          {saveStatus === 'saved' && (
            <span className="text-xs font-semibold" style={{ color: 'var(--cs-success)' }}>✓ Saved to backend</span>
          )}
          {saveStatus === 'failed' && (
            <span className="text-xs font-semibold" style={{ color: 'var(--cs-alert)' }}>⚠ Could not reach backend</span>
          )}
        </div>

        {/* Active rule card */}
        <div className="p-5" style={{ background: 'var(--cs-surface)', border: '1px solid var(--cs-border)', borderRadius: 16, boxShadow: 'var(--cs-shadow)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold" style={{ color: 'var(--cs-primary-dk)' }}>Active Rule</span>
            <span className="flex items-center gap-[6px] text-xs font-semibold" style={{ color: 'var(--cs-success)' }}>
              <span className="w-[7px] h-[7px] rounded-full inline-block pulse" style={{ background: 'var(--cs-success)' }} />
              Monitoring
            </span>
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--cs-ink)' }}>{activeRule}</p>
          <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>Last triggered: {lastTriggered}</p>
        </div>
      </div>
    </div>
  )
}
