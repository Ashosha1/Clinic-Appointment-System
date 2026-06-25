'use client'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { useToast, type ToastVariant } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: React.ReactNode }> = {
  default: {
    bar: 'border-l-[var(--p)]',
    icon: <Info size={18} className="text-[var(--p)]" />,
  },
  success: {
    bar: 'border-l-[var(--green)]',
    icon: <CheckCircle2 size={18} className="text-[var(--green)]" />,
  },
  destructive: {
    bar: 'border-l-[var(--red)]',
    icon: <AlertCircle size={18} className="text-[var(--red)]" />,
  },
}

/** Renders the active toast stack. Mount once, near the root. */
export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant ?? 'default']
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-[var(--radius)] border border-l-4 border-[var(--card-border)] bg-[var(--card)] p-3.5 shadow-card animate-in slide-in-from-bottom-2',
              style.bar
            )}
          >
            <span className="mt-0.5 shrink-0">{style.icon}</span>
            <div className="min-w-0 flex-1">
              {t.title && (
                <p className="text-sm font-semibold text-[var(--txt)]">{t.title}</p>
              )}
              {t.description && (
                <p className="mt-0.5 text-sm text-[var(--txt2)]">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-[var(--txt3)] transition-colors hover:text-[var(--txt)]"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
