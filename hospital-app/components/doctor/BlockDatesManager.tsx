'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { toast } from '@/hooks/use-toast'
import { blockDate, unblockDate } from '@/lib/actions/blocked-dates'
import { dateKey } from '@/lib/scheduling/time'

interface BlockedEntry {
  date: string
  reason: string | null
}

interface BlockDatesManagerProps {
  doctorId: string
  initial: BlockedEntry[]
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlockDatesManager({ doctorId, initial }: BlockDatesManagerProps) {
  const [blocked, setBlocked] = useState<BlockedEntry[]>(
    [...initial].sort((a, b) => a.date.localeCompare(b.date))
  )
  const [selected, setSelected] = useState<Date | null>(null)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  const today = startOfToday()
  const blockedKeys = new Set(blocked.map((b) => b.date))

  function onBlock() {
    if (!selected) return
    const key = dateKey(selected)
    startTransition(async () => {
      const res = await blockDate(doctorId, key, reason)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not block date', description: res.error })
        return
      }
      setBlocked((prev) =>
        [...prev, { date: key, reason: reason.trim() || null }].sort((a, b) =>
          a.date.localeCompare(b.date)
        )
      )
      setSelected(null)
      setReason('')
      toast({ variant: 'success', title: 'Date blocked' })
    })
  }

  function onUnblock(key: string) {
    startTransition(async () => {
      const res = await unblockDate(doctorId, key)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not unblock', description: res.error })
        return
      }
      setBlocked((prev) => prev.filter((b) => b.date !== key))
      toast({ variant: 'success', title: 'Date unblocked' })
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <Calendar
          selected={selected}
          onSelect={setSelected}
          isDisabled={(d) => d < today}
          highlighted={blockedKeys}
        />
        <div className="mt-4 space-y-2">
          <Label htmlFor="block-reason">Reason (optional)</Label>
          <Input
            id="block-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Public holiday, conference"
          />
        </div>
        <Button
          onClick={onBlock}
          disabled={!selected || pending}
          className="mt-3 w-full"
        >
          {selected ? `Block ${formatDate(dateKey(selected))}` : 'Select a date to block'}
        </Button>
      </div>

      <div>
        <h3 className="mb-3 text-[15px] font-medium text-[var(--txt)]">Blocked dates</h3>
        {blocked.length === 0 ? (
          <p className="text-xs text-[var(--txt3)]">No blocked dates.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {blocked.map((b) => (
              <li
                key={b.date}
                className="flex items-center gap-2 rounded-full bg-[var(--red-light)] px-3 py-1.5 text-xs text-[var(--red)]"
              >
                <span className="font-medium">{formatDate(b.date)}</span>
                {b.reason && <span className="opacity-80">· {b.reason}</span>}
                <button
                  type="button"
                  onClick={() => onUnblock(b.date)}
                  disabled={pending}
                  aria-label={`Unblock ${b.date}`}
                  className="rounded-full p-0.5 transition-opacity hover:opacity-70"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
