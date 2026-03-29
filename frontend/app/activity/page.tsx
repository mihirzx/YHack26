'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './activity.module.css'

type EventType = 'violation' | 'corrected'

interface LogEvent {
  id: string
  type: EventType
  title: string
  description: string
  time: string
}

interface Snapshot {
  id: string
  type: EventType
  label: string
  time: string
}

const INITIAL_EVENTS: LogEvent[] = [
  { id: '1', type: 'corrected', title: 'Intervention Successful', description: 'Patient corrected — put down blue pill, picked up red pill.', time: '12:38 PM' },
  { id: '2', type: 'violation', title: 'Unsafe Medication Detected', description: 'Patient picked blue pill — expected red. Alert sent.', time: '12:37 PM' },
  { id: '3', type: 'corrected', title: 'Rule Check Passed', description: 'Patient took red pill as instructed. No issues.', time: '12:10 PM' },
]

const INITIAL_SNAPSHOTS: Snapshot[] = [
  { id: '1', type: 'corrected', label: 'Corrected', time: '12:38 PM · Room 1' },
  { id: '2', type: 'violation', label: 'Violation',  time: '12:37 PM · Room 1' },
  { id: '3', type: 'corrected', label: 'Corrected', time: '12:10 PM · Room 1' },
]

const VIOLATION_TYPES = [
  { title: 'Unsafe Medication Detected',     description: 'Patient picked orange pill — expected red.' },
  { title: 'Wrong Pill Color Observed',      description: 'Patient holding blue capsule. Rule: red pills only.' },
  { title: 'Non-Compliant Medication Attempt', description: 'Patient reached for green pill, expected red.' },
]

let counter = 0

export default function ActivityPage() {
  const [events, setEvents]       = useState<LogEvent[]>(INITIAL_EVENTS)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS)
  const [clock, setClock]         = useState('')
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

    const newEvent: LogEvent = {
      id: `evt-${Date.now()}`,
      type: 'violation',
      title: viol.title,
      description: viol.description,
      time: now,
    }
    const newSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      type: 'violation',
      label: 'Violation',
      time: `${now} · Room 1`,
    }

    setEvents(prev => [newEvent, ...prev])
    setSnapshots(prev => [newSnap, ...prev])

    setTimeout(() => {
      logRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Activity — Room 1</h1>
        <p className={styles.pageSubtitle}>Margaret · Medication monitoring active</p>
      </header>

      <div className={styles.layout}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* Live feed */}
          <div className={styles.feedWrapper}>
            <div className={styles.feedPlaceholder} role="img" aria-label="Live camera feed for Room 1">
              <span className={styles.feedCamIcon} aria-hidden="true">📷</span>
              <div className={styles.liveBadge}>
                <span className={`${styles.dot} ${styles.dotLive} pulse`} />
                LIVE
              </div>
              <div className={styles.feedTs}>{clock}</div>
            </div>

            {/* Event log */}
            <div className={styles.logHeader}>
              <span className={styles.logTitle}>Event Log</span>
              <button className={styles.simBtn} onClick={simulateAlert}>
                + Simulate Alert
              </button>
            </div>
            <div
              className={styles.eventLog}
              ref={logRef}
              aria-live="polite"
              aria-label="Event log"
            >
              {events.map((evt) => (
                <div key={evt.id} className={`${styles.eventItem} ${evt.type === 'corrected' ? styles.eventOk : ''}`}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventIcon} aria-hidden="true">
                      {evt.type === 'corrected' ? '✅' : '⚠️'}
                    </span>
                    <span className={`${styles.eventTitle} ${evt.type === 'corrected' ? styles.titleOk : styles.titleViol}`}>
                      {evt.title}
                    </span>
                    <span className={styles.eventTime}>{evt.time}</span>
                  </div>
                  <p className={styles.eventDesc}>{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className={styles.rightCol} aria-label="Notable snapshots">
          <h2 className={styles.snapHeading}>Notable Snapshots</h2>
          <div className={styles.snapList}>
            {snapshots.map((snap) => (
              <div key={snap.id} className={styles.snapCard}>
                <div className={`${styles.snapThumb} ${snap.type === 'corrected' ? styles.thumbOk : styles.thumbViol}`}>
                  {snap.type === 'corrected' ? '✅' : '⚠️'}
                </div>
                <div className={styles.snapMeta}>
                  <div className={`${styles.snapLabel} ${snap.type === 'corrected' ? styles.snapOk : styles.snapViol}`}>
                    {snap.label}
                  </div>
                  <div className={styles.snapTime}>{snap.time}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}