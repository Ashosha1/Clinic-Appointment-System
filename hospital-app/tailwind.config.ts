import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design-system tokens wired to CSS variables (theme-aware)
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        txt: 'var(--txt)',
        txt2: 'var(--txt2)',
        txt3: 'var(--txt3)',
        border: 'var(--border)',
        card: { DEFAULT: 'var(--card)', border: 'var(--card-border)' },
        primary: {
          DEFAULT: '#0B6E4F',
          hover: '#1D9E75',
          light: '#E6F4EF',
          dark: '#064033',
        },
        slate: {
          1: '#F7F9FB',
          2: '#EEF2F6',
          3: '#D6DDE6',
        },
        status: {
          confirmed: { bg: '#F0FFF4', text: '#276749' },
          pending: { bg: '#FEF3E2', text: '#C05621' },
          cancelled: { bg: '#FFF5F5', text: '#C53030' },
          completed: { bg: '#EBF2FF', text: '#1A4DB5' },
        },
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11,110,79,0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
