'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

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
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`} aria-label="Main navigation">
      <Link href="/" className={styles.logo} aria-label="CareSight home">
        <svg className={`${styles.heartSvg} heartbeat`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.82 3.82 12 5C12.18 3.82 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14.5 12 21 12 21Z"
            fill="#5BBFBE"
          />
        </svg>
        CareSight
      </Link>

      <div className={styles.links} role="list">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              role="listitem"
              className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}