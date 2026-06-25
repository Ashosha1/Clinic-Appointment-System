import Link from 'next/link'
import { Compass, ArrowLeft } from 'lucide-react'

import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <Logo size={40} />
      <span className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--p3)] text-[var(--p)]">
        <Compass size={26} aria-hidden="true" />
      </span>
      <p className="mt-5 text-sm font-medium uppercase tracking-[0.08em] text-[var(--p)]">
        404
      </p>
      <h1 className="mt-1 text-2xl font-medium text-[var(--txt)]">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--txt2)]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
