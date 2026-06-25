import Link from 'next/link'

import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--p4)] p-12 text-white lg:flex">
        <Link href="/" className="relative z-10 inline-flex">
          <Logo withWordmark />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Your trusted path to care.
          </h2>
          <p className="mt-4 text-white/70">
            Book appointments, manage your schedule, and stay in sync with your
            clinic — all in one calm, organized place.
          </p>
        </div>
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--p)]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[var(--p2)]/20 blur-3xl"
        />
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center bg-[var(--bg)] px-6 py-12">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo withWordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
