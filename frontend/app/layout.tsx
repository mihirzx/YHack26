import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'CareSight — Care, Always Within Reach',
  description: 'Real-time AI monitoring that alerts caregivers the moment a patient needs attention.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body 
        className="bg-cs-bg min-h-screen"
        suppressHydrationWarning={true}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}