'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/activity',  label: 'Activity' },
  { href: '/manage',    label: 'Manage' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      aria-label="Main navigation"
      className={`flex items-center justify-between px-8 h-[64px] sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/92 backdrop-blur-lg shadow-[0_2px_12px_rgba(91,191,190,0.08)] border-b border-[#D0E8E7]' 
          : 'bg-white/75'
      }`}
    >
      <Link
        href="/"
        aria-label="Buddy home"
        className="font-display flex items-center gap-2 text-2xl no-underline text-[#2E6B6A] hover:scale-105 transition-transform"
      >
        <svg className="w-7 h-7 heartbeat" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.82 3.82 12 5C12.18 3.82 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14.5 12 21 12 21Z"
            fill="#5BBFBE"
          />
        </svg>
        Buddy
      </Link>

      <div className="flex gap-3" role="list">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              role="listitem"
              className={`cs-nav-link text-base ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}