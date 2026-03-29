import CameraCard from '@/components/CameraCard'

const ROOMS = [
  { id: 1, roomName: 'Room 1', patientName: 'Margaret', status: 'alert' as const, lastViewed: '1 min ago',  alertCount: 3 },
  { id: 2, roomName: 'Room 2', patientName: 'Robert',   status: 'live'  as const, lastViewed: 'now',        alertCount: 0 },
  { id: 3, roomName: 'Room 3', patientName: 'Dorothy',  status: 'idle'  as const, lastViewed: '12 min ago', alertCount: 1 },
  { id: 4, roomName: 'Room 4', patientName: 'Harold',   status: 'live'  as const, lastViewed: 'now',        alertCount: 0 },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      <header className="mb-7 fade-up">
        <h1
          style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, color: 'var(--cs-primary-dk)' }}
        >
          Active Monitoring
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
          4 rooms active · Last refreshed just now
        </p>
      </header>

      <section
        aria-label="Camera feeds"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
      >
        {ROOMS.map((room) => (
          <CameraCard key={room.id} {...room} />
        ))}
      </section>
    </div>
  )
}