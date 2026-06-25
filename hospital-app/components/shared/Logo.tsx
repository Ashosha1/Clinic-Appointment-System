import { cn } from '@/lib/utils'

interface LogoProps {
  /** Pixel size of the mark. Defaults to 36. */
  size?: number
  /** Show the "MediConnect" wordmark beside the mark. */
  withWordmark?: boolean
  className?: string
}

/** MediConnect interlocking-cross mark. */
export function Logo({ size = 36, withWordmark = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="MediConnect"
      >
        <rect x="14" y="4" width="8" height="28" rx="3" fill="#0B6E4F" />
        <rect x="4" y="14" width="28" height="8" rx="3" fill="#1D9E75" />
        <rect x="14" y="14" width="8" height="8" rx="2" fill="#064033" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-[var(--txt)]">
          MediConnect
        </span>
      )}
    </span>
  )
}
