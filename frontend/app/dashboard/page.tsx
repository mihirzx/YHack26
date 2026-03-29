'use client'

import { useState, useEffect } from 'react'
import CameraCard from '@/components/CameraCard'
import { fetchEvents } from '@/lib/api'
import { deriveRoomStatus, countAlerts, lastViewedLabel } from '@/lib/transforms'

const ROOMS_DEFAULT = [
  { id: 1, roomName: 'Room 1', patientName: 'Margaret', status: 'alert' as const, lastViewed: '1 min ago',  alertCount: 3 },
  { id: 2, roomName: 'Room 2', patientName: 'Robert',   status: 'live'  as const, lastViewed: 'now',        alertCount: 0 },
  { id: 3, roomName: 'Room 3', patientName: 'Dorothy',  status: 'idle'  as const, lastViewed: '12 min ago', alertCount: 1 },
  { id: 4, roomName: 'Room 4', patientName: 'Harold',   status: 'live'  as const, lastViewed: 'now',        alertCount: 0 },
]

export default function DashboardPage() {
  const [rooms, setRooms] = useState(ROOMS_DEFAULT)
  const [lastRefresh, setLastRefresh] = useState('just now')

  useEffect(() => {
    let active = true

    async function poll() {
      const events = await fetchEvents(20)
      if (!active) return

      if (events.length > 0) {
        const status = deriveRoomStatus(events)
        const alerts = countAlerts(events)
        const viewed = lastViewedLabel(events)

        setRooms(prev => prev.map(room =>
          room.id === 1
            ? { ...room, status, alertCount: alerts, lastViewed: viewed }
            : room
        ))
        setLastRefresh('just now')
      }
    }

    poll()
    const id = setInterval(poll, 5000)
    return () => { active = false; clearInterval(id) }
  }, [])

  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1
          style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}
        >
          Active Monitoring
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          {rooms.length} rooms active · Last refreshed {lastRefresh}
        </p>
      </header>

      <section
        aria-label="Camera feeds"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
      >
        {rooms.map((room) => (
          <CameraCard key={room.id} {...room} />
        ))}
      </section>
    </div>
  )
}
