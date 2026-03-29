import Link from 'next/link'
import styles from './CameraCard.module.css'

type Status = 'live' | 'alert' | 'idle'

interface Props {
  roomName: string
  patientName: string
  status: Status
  lastViewed: string
  alertCount: number
}

const STATUS_LABELS: Record<Status, string> = {
  live:  'LIVE',
  alert: 'ALERT',
  idle:  'IDLE',
}

const BG_GRADIENTS: Record<Status, string> = {
  live:  'linear-gradient(135deg, #d4f0e8 0%, #b0ddd0 100%)',
  alert: 'linear-gradient(135deg, #c8ede9 0%, #9fe1cb 100%)',
  idle:  'linear-gradient(135deg, #e8f0f0 0%, #d0e4e4 100%)',
}

export default function CameraCard({ roomName, patientName, status, lastViewed, alertCount }: Props) {
  return (
    <Link href="/activity" className={styles.card} aria-label={`${roomName} — ${patientName}, status: ${STATUS_LABELS[status]}`}>
      {/* Camera image area */}
      <div className={styles.camImg} style={{ background: BG_GRADIENTS[status] }}>
        <span className={styles.camIcon} aria-hidden="true">📷</span>
        <div className={`${styles.badge} ${styles[`badge_${status}`]}`}>
          <span className={`${styles.dot} ${styles[`dot_${status}`]} ${status !== 'idle' ? 'pulse' : ''}`} />
          {STATUS_LABELS[status]}
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.roomName}>{roomName} — {patientName}</h3>
        <div className={styles.meta}>
          <span>Last viewed: {lastViewed}</span>
          {alertCount > 0
            ? <span className={styles.alertCount}>{alertCount} alert{alertCount !== 1 ? 's' : ''} today</span>
            : <span className={styles.noAlert}>0 alerts today</span>
          }
        </div>
      </div>
    </Link>
  )
}