'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-light)] text-[var(--red)]">
        <AlertTriangle size={26} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-medium text-[var(--txt)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--txt2)]">
        An unexpected error occurred. You can try again, and if the problem
        persists, please contact support.
      </p>
      <Button
        variant="outline"
        className="mt-6 border-[var(--p)] text-[var(--p)] hover:bg-[var(--p3)]"
        onClick={reset}
      >
        <RotateCcw size={16} aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
