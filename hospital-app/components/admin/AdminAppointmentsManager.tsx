'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Download, Search } from 'lucide-react'

import { Avatar } from '@/components/shared/Avatar'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { formatTime12h } from '@/lib/scheduling/time'
import {
  bulkConfirmAppointments,
  overrideAppointmentStatus,
} from '@/lib/actions/admin'
import type { AdminAppointmentRow, DoctorOption } from '@/lib/actions/admin-data'
import type { AppointmentStatus } from '@/types/database'

const PAGE_SIZE = 20
const STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled']
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatDate(slotDate: string): string {
  const d = new Date(`${slotDate}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

const inputClass =
  'h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--txt)] outline-none focus:ring-2 focus:ring-[var(--p)]'

export function AdminAppointmentsManager({
  rows,
  doctors,
}: {
  rows: AdminAppointmentRow[]
  doctors: DoctorOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [status, setStatus] = useState<'all' | AppointmentStatus>('all')
  const [doctorId, setDoctorId] = useState<'all' | string>('all')
  const [patientQuery, setPatientQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)

  // Override modal state
  const [target, setTarget] = useState<AdminAppointmentRow | null>(null)
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed')
  const [reason, setReason] = useState('')

  const filtered = useMemo(() => {
    const q = patientQuery.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (doctorId !== 'all' && r.doctor_id !== doctorId) return false
      if (q && !r.patient_name.toLowerCase().includes(q)) return false
      if (from && r.slot_date < from) return false
      if (to && r.slot_date > to) return false
      return true
    })
  }, [rows, status, doctorId, patientQuery, from, to])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const pendingInView = useMemo(
    () => filtered.filter((r) => r.status === 'pending'),
    [filtered]
  )

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setPage(0)
    }
  }

  function handleBulkConfirm() {
    const ids = pendingInView.map((r) => r.id)
    if (ids.length === 0) return
    startTransition(async () => {
      const res = await bulkConfirmAppointments(ids)
      if ('count' in res) {
        toast({
          variant: 'success',
          title: `Confirmed ${res.count} appointment${res.count === 1 ? '' : 's'}`,
        })
        router.refresh()
      } else {
        toast({ variant: 'destructive', title: 'Bulk confirm failed', description: res.error })
      }
    })
  }

  function handleExport() {
    const header = ['Patient', 'Doctor', 'Specialty', 'Date', 'Start', 'End', 'Status']
    const lines = filtered.map((r) =>
      [
        r.patient_name,
        r.doctor_name,
        r.doctor_specialty,
        r.slot_date,
        r.start_time,
        r.end_time,
        STATUS_LABEL[r.status],
      ]
        .map((c) => csvCell(String(c)))
        .join(',')
    )
    const csv = [header.map(csvCell).join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function openOverride(row: AdminAppointmentRow) {
    setTarget(row)
    setNewStatus(row.status === 'pending' ? 'confirmed' : row.status)
    setReason('')
  }

  function submitOverride() {
    if (!target) return
    const row = target
    startTransition(async () => {
      const res = await overrideAppointmentStatus(row.id, newStatus, reason)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not update', description: res.error })
      } else {
        toast({
          variant: 'success',
          title: `Status set to ${STATUS_LABEL[newStatus]}`,
          description: row.patient_name,
        })
        setTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
          />
          <input
            value={patientQuery}
            onChange={(e) => resetPage(setPatientQuery)(e.target.value)}
            placeholder="Search patient…"
            className={cn(inputClass, 'pl-8')}
          />
        </div>
        <select
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as 'all' | AppointmentStatus)}
          className={inputClass}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={doctorId}
          onChange={(e) => resetPage(setDoctorId)(e.target.value)}
          className={inputClass}
        >
          <option value="all">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => resetPage(setFrom)(e.target.value)}
          aria-label="From date"
          className={inputClass}
        />
        <span className="text-xs text-[var(--txt3)]">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => resetPage(setTo)(e.target.value)}
          aria-label="To date"
          className={inputClass}
        />
        {(status !== 'all' || doctorId !== 'all' || patientQuery || from || to) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              setStatus('all')
              setDoctorId('all')
              setPatientQuery('')
              setFrom('')
              setTo('')
              setPage(0)
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--txt2)]">
          {filtered.length} appointment{filtered.length === 1 ? '' : 's'}
          {pendingInView.length > 0 && ` · ${pendingInView.length} pending`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download size={14} />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-9"
            onClick={handleBulkConfirm}
            disabled={pending || pendingInView.length === 0}
          >
            <CheckCheck size={14} />
            Confirm all pending
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--txt3)]">
              <th className="px-4 py-2.5 font-medium">Patient</th>
              <th className="px-4 py-2.5 font-medium">Doctor</th>
              <th className="px-4 py-2.5 font-medium">Date &amp; time</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--txt3)]">
                  No appointments match these filters.
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
                  <td className="px-4 py-3">
                    <div className="text-[var(--txt)]">{formatDate(row.slot_date)}</div>
                    <div className="text-xs text-[var(--txt3)]">
                      {formatTime12h(row.start_time)} – {formatTime12h(row.end_time)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOverride(row)}
                      title="Change status"
                      className="rounded-full ring-offset-2 ring-offset-[var(--card)] transition hover:ring-2 hover:ring-[var(--border)]"
                    >
                      <StatusPill status={row.status} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
      </div>

      {/* Status override modal */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-xl"
          >
            <h2 className="text-[15px] font-medium text-[var(--txt)]">Change status</h2>
            <p className="mt-1.5 text-sm text-[var(--txt2)]">
              {target.patient_name} · {target.doctor_name} · {formatDate(target.slot_date)}
            </p>

            <label className="mt-4 block text-xs font-medium text-[var(--txt2)]">New status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
              className={cn(inputClass, 'mt-1.5 w-full')}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-medium text-[var(--txt2)]">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this status changing?"
              className="mt-1.5 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--txt)] outline-none focus:ring-2 focus:ring-[var(--p)]"
            />

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" disabled={pending} onClick={() => setTarget(null)}>
                Cancel
              </Button>
              <Button
                disabled={pending || !reason.trim() || newStatus === target.status}
                onClick={submitOverride}
              >
                {pending ? 'Working…' : 'Update status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
