import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:           '#EEF8F7',
        surface:      '#FFFFFF',
        'surface-alt':'#F7FAF9',
        primary:      '#5BBFBE',
        'primary-lt': '#A8DEDD',
        'primary-dk': '#2E6B6A',
        accent:       '#C8EDE9',
        alert:        '#E05C5C',
        'alert-lt':   '#FDEAEA',
        success:      '#4CAF8A',
        'success-lt': '#E2F5ED',
        ink:          '#1E3A3A',
        muted:        '#7A9E9E',
        border:       '#D0E8E7',
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body:    ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card:      '0 4px 24px rgba(91,191,190,0.10)',
        'card-hov':'0 8px 32px rgba(91,191,190,0.18)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.4)', opacity: '0.7' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.12)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        heartbeat:   'heartbeat 2.4s ease-in-out infinite',
        'slide-in':  'slide-in 300ms ease both',
        'fade-up':   'fade-up 400ms ease-out both',
      },
    },
  },
  plugins: [],
}

export default config