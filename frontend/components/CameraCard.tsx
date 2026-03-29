'use client';

import Link from 'next/link'

export type Status = 'live' | 'alert' | 'idle'

interface Props {
  roomName:    string
  patientName: string
  status:      Status
  lastViewed:  string
  alertCount:  number
}

const STATUS_LABEL: Record<Status, string> = { live: 'LIVE', alert: 'ALERT', idle: 'IDLE' }

const BADGE_STYLE: Record<Status, React.CSSProperties> = {
  live:  { background: 'rgba(76,175,138,0.15)', color: '#1a7a55', border: '1px solid rgba(76,175,138,0.3)' },
  alert: { background: 'rgba(224,92,92,0.15)',  color: '#b02020', border: '1px solid rgba(224,92,92,0.3)' },
  idle:  { background: 'rgba(122,158,158,0.15)',color: '#7A9E9E', border: '1px solid #D0E8E7' },
}

const DOT_COLOR: Record<Status, string> = { live: '#4CAF8A', alert: '#E05C5C', idle: '#7A9E9E' }

const CAM_BG: Record<Status, string> = {
  live:  'linear-gradient(135deg,#d4f0e8 0%,#b0ddd0 100%)',
  alert: 'linear-gradient(135deg,#c8ede9 0%,#9fe1cb 100%)',
  idle:  'linear-gradient(135deg,#e8f0f0 0%,#d0e4e4 100%)',
}

export default function CameraCard({ roomName, patientName, status, lastViewed, alertCount }: Props) {
  const isAnimated = status !== 'idle'

  return (
    <Link
      href="/activity"
      aria-label={`${roomName} — ${patientName}, status: ${STATUS_LABEL[status]}`}
      className="block no-underline rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] cs-card"
      onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--cs-shadow-hov)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--cs-shadow)')}
    >
      {/* Camera image */}
      <div
        className="h-[180px] relative flex items-center justify-center"
        style={{ background: CAM_BG[status] }}
      >
        {/* Badge */}
        <div
          className="absolute top-[10px] right-[10px] flex items-center gap-[5px] px-[10px] py-1 rounded-full text-[11px] font-bold"
          style={BADGE_STYLE[status]}
        >
          <span
            className={`w-[7px] h-[7px] rounded-full inline-block ${isAnimated ? 'pulse' : ''}`}
            style={{ background: DOT_COLOR[status] }}
          />
          {STATUS_LABEL[status]}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-[14px]">
        <h3 className="text-sm font-bold mb-[6px] text-[#1E3A3A]">
          {roomName} — {patientName}
        </h3>
        <div className="flex justify-between items-center text-xs text-[#7A9E9E]">
          <span>Last viewed: {lastViewed}</span>
          {alertCount > 0
            ? <span className="font-semibold text-[#E05C5C]">{alertCount} alert{alertCount !== 1 ? 's' : ''} today</span>
            : <span>0 alerts today</span>
          }
        </div>
      </div>
    </Link>
  )
}