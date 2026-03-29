import CameraCard from '@/components/CameraCard'
import styles from './dashboard.module.css'

const rooms = [
  { id: 1, roomName: 'Room 1', patientName: 'Margaret', status: 'alert' as const, lastViewed: '1 min ago', alertCount: 3 },
  { id: 2, roomName: 'Room 2', patientName: 'Robert',   status: 'live'  as const, lastViewed: 'now',       alertCount: 0 },
  { id: 3, roomName: 'Room 3', patientName: 'Dorothy',  status: 'idle'  as const, lastViewed: '12 min ago', alertCount: 1 },
  { id: 4, roomName: 'Room 4', patientName: 'Harold',   status: 'live'  as const, lastViewed: 'now',       alertCount: 0 },
]

export default function DashboardPage() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Active Monitoring</h1>
        <p className={styles.pageSubtitle}>4 rooms active · Last refreshed just now</p>
      </header>

      <section className={styles.camGrid} aria-label="Camera feeds">
        {rooms.map((room) => (
          <CameraCard key={room.id} {...room} />
        ))}
      </section>
    </div>
  )
}