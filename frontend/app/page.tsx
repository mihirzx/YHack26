import Link from 'next/link'

const FEATURES = [
  {
    icon: '📷',
    title: 'Live Monitoring',
    desc: 'Watch any room in real time from anywhere. Camera feeds update continuously with zero-delay alerts.',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    desc: "Write plain-language rules. Our AI watches so you don't have to — and notifies you the moment something's wrong.",
  },
  {
    icon: '🖼️',
    title: 'Instant Snapshots',
    desc: 'Every alert captures a timestamped snapshot, giving you a visual audit trail for incident review.',
  },
]

export default function LandingPage() {
  return (
    <div className="p-8 flex flex-col gap-12" style={{ minHeight: 'calc(100vh - 58px)' }}>
      {/* Hero */}
      <section
        className="fade-up rounded-3xl py-20 px-10 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #A8DEDD 0%, #C8EDE9 35%, #EEF8F7 70%)' }}
      >
        <h1
          className="font-display leading-tight mb-4"
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(40px, 6vw, 64px)',
            color: '#2E6B6A',
          }}
        >
          Care, Always<br />Within Reach
        </h1>
        <p className="text-lg mb-9 max-w-[480px] mx-auto" style={{ color: '#7A9E9E' }}>
          Real-time AI monitoring that alerts caregivers the moment a patient needs attention.
        </p>
        <Link href="/dashboard" className="cs-btn-primary">
          Get Started →
        </Link>
      </section>

      {/* Feature strip */}
      <section
        aria-label="Features"
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="fade-up rounded-2xl p-7 text-center cs-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-[14px] text-[22px] cs-accent-bg">
              {f.icon}
            </div>
            <h3 className="text-base font-bold mb-2 cs-primary-dk-text">
              {f.title}
            </h3>
            <p className="text-[13px] leading-relaxed cs-muted-text">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer
        className="mt-auto pt-6 flex items-center justify-between"
        style={{ borderTop: '1px solid #D0E8E7' }}
      >
        <span className="text-base font-display cs-primary-dk-text">
          CareSight
        </span>
        <span className="text-xs cs-muted-text">
          © {new Date().getFullYear()} CareSight. All rights reserved.
        </span>
      </footer>
    </div>
  )
}