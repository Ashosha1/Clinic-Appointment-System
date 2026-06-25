import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  /** Optional call-to-action. Provide `href` for a link or `onClick` for a button. */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

/** Reusable empty-state for lists with no results (appointments, doctors, slots). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg2)] px-6 py-12 text-center',
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--p3)] text-[var(--p)]">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-medium text-[var(--txt)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--txt2)]">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Button asChild size="sm" className="mt-5">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button size="sm" className="mt-5" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
