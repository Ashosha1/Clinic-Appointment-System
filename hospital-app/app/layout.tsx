import type { Metadata } from 'next'

import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediConnect — Your trusted path to care.',
  description:
    'MediConnect is a clinic appointment scheduling platform. Patients book, reschedule, and cancel appointments while doctors manage their availability.',
}

// Apply the persisted theme before first paint to avoid a flash of light mode.
const themeScript = `
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (_) {}
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
