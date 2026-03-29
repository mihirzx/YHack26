'use client'

import { useState } from 'react'
import styles from './manage.module.css'

const DEFAULT_RULE = 'Patient should only take red pills.'

export default function ManagePage() {
  const [ruleInput, setRuleInput] = useState(DEFAULT_RULE)
  const [activeRule, setActiveRule] = useState(DEFAULT_RULE)
  const [lastTriggered, setLastTriggered] = useState('4 minutes ago')

  function saveRule() {
    const trimmed = ruleInput.trim()
    if (!trimmed) return
    setActiveRule(trimmed)
    setLastTriggered('just now')
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Monitoring Rules</h1>
        <p className={styles.pageSubtitle}>Define what the AI should watch for in each camera feed.</p>
      </header>

      <div className={styles.content}>
        <div className={styles.infoBox}>
          💡 The AI watches the live feed and compares what it observes to your rule. When a patient's action doesn't match — like grabbing the wrong pill — you're alerted instantly.
        </div>

        {/* Pill preview */}
        <div className={styles.pillPreview} aria-label="Pill organizer preview">
          <div className={styles.pillBoxVisual}>
            {['#e05c5c','#e05c5c','#4CAF8A','#e05c5c','#5B8FBF','#e05c5c','#F0A030','#e05c5c'].map((color, i) => (
              <div key={i} className={styles.pill} style={{ background: color }} />
            ))}
          </div>
        </div>

        {/* Rule textarea */}
        <label className={styles.ruleLabel} htmlFor="rule-input">Monitoring Rule</label>
        <textarea
          id="rule-input"
          className={styles.ruleArea}
          value={ruleInput}
          onChange={(e) => setRuleInput(e.target.value)}
          placeholder="e.g. Patient should only take the red pill."
          rows={4}
        />

        <button className={styles.saveBtn} onClick={saveRule}>
          Save Rule
        </button>

        {/* Active rule card */}
        <div className={styles.activeRuleCard}>
          <div className={styles.arcHeader}>
            <span className={styles.arcTitle}>Active Rule</span>
            <span className={styles.arcStatus}>
              <span className={`${styles.dot} ${styles.dotLive} pulse`} />
              Monitoring
            </span>
          </div>
          <p className={styles.arcRule}>{activeRule}</p>
          <p className={styles.arcMeta}>Last triggered: {lastTriggered}</p>
        </div>
      </div>
    </div>
  )
}