'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Eye, X } from 'lucide-react'

import { Avatar } from '@/components/shared/Avatar'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatTime12h } from '@/lib/scheduling/time'
import { confirmAppointment, cancelAppointmentByAdmin } from '@/lib/actions/admin'
import type { AdminAppointmentRow } from '@/lib/actions/admin-data'

const PAGE_SIZE = 10
const FILTERS = ['all', 'pending', 'today'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABEL: Record<Filter, string> = { all: 'All', pending: 'Pending', today: 'Today' }

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function formatDate(slotDate: string): string {
  const d = new Date(`${slotDate}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AdminAppointmentsTable({ rows }: { rows: AdminAppointmentRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const [pending, startTransition] = useTransition()
  const [cancelTarget, setCancelTarget] = useState<AdminAppointmentRow | null>(null)
  const [reason, setReason] = useState('')

  const filtered = useMemo(() => {
    const tk = todayKey()
    if (filter === 'pending') return rows.filter((r) => r.status === 'pending')
    if (filter === 'today') return rows.filter((r) => r.slot_date === tk)
    return rows
  }, [rows, filter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function changeFilter(next: Filter) {
    setFilter(next)
    setPage(0)
  }

  function handleConfirm(row: AdminAppointmentRow) {
    startTransition(async () => {
      const res = await confirmAppointment(row.id)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not confirm', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Appointment confirmed', description: row.patient_name })
        router.refresh()
      }
    })
  }

  function submitCancel() {
    if (!cancelTarget) return
    const target = cancelTarget
    startTransition(async () => {
      const res = await cancelAppointmentByAdmin(target.id, reason)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not cancel', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Appointment cancelled', description: target.patient_name })
        setCancelTarget(null)
        setReason('')
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--txt)]">Appointments</h3>
        <div
          role="tablist"
          className="inline-flex gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg2)] p-1"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => changeFilter(f)}
              className={cn(
                'rounded-[6px] px-3 py-1 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-[var(--card)] text-[var(--txt)] shadow-card'
                  : 'text-[var(--txt2)] hover:text-[var(--txt)]'
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--txt3)]">
              <th className="px-4 py-2.5 font-medium">Patient</th>
              <th className="px-4 py-2.5 font-medium">Doctor</th>
              <th className="px-4 py-2.5 font-medium">Date &amp; time</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--txt3)]">
                  No appointments to show.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg2)]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.patient_name} src={row.patient_avatar} size={30} />
                      <span className="font-medium text-[var(--txt)]">{row.patient_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[var(--txt)]">{row.doctor_name}</div>
                    {row.doctor_specialty && (
                      <div className="text-xs text-[var(--txt3)]">{row.doctor_specialty}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--txt2)]">
                    <div className="text-[var(--txt)]">{formatDate(row.slot_date)}</div>
                    <div className="text-xs text-[var(--txt3)]">
                      {formatTime12h(row.start_time)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        title="View"
                      >
                        <Link href={`/admin/appointments?id=${row.id}`}>
                          <Eye size={14} />
                        </Link>
                      </Button>
                      {row.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleConfirm(row)}
                          className="h-8 border-[var(--green)] px-2 text-[var(--green)] hover:bg-[var(--green-light)]"
                          title="Confirm"
                        >
                          <Check size={14} />
                        </Button>
                      )}
                      {(row.status === 'pending' || row.status === 'confirmed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setCancelTarget(row)
                            setReason('')
                          }}
                          className="h-8 border-[var(--red)] px-2 text-[var(--red)] hover:bg-[var(--red-light)]"
                          title="Cancel"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--txt2)]">
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Cancel-with-reason modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setCancelTarget(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-xl"
          >
            <h2 className="text-[15px] font-medium text-[var(--txt)]">Cancel appointment</h2>
            <p className="mt-1.5 text-sm text-[var(--txt2)]">
              Cancelling {cancelTarget.patient_name}&apos;s appointment with{' '}
              {cancelTarget.doctor_name}. The patient will be notified.
            </p>
            <label className="mt-4 block text-xs font-medium text-[var(--txt2)]">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. Doctor unavailable due to emergency"
              className="mt-1.5 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--txt)] outline-none focus:ring-2 focus:ring-[var(--p)]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setCancelTarget(null)}
              >
                Keep appointment
              </Button>
              <Button
                variant="destructive"
                disabled={pending || !reason.trim()}
                onClick={submitCancel}
              >
                {pending ? 'Working…' : 'Cancel appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
