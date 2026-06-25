'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

import { Avatar } from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { setDoctorApproval, updateDoctorDetails } from '@/lib/actions/admin'
import type { AdminDoctor } from '@/lib/actions/admin-data'

const fieldClass =
  'h-8 w-full rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-sm text-[var(--txt)] outline-none hover:border-[var(--border)] focus:border-[var(--p)] focus:bg-[var(--bg)]'

/** Inline, save-on-blur text/number field. Reverts on error. */
function EditableField({
  initial,
  type = 'text',
  prefix,
  onSave,
  ariaLabel,
}: {
  initial: string
  type?: 'text' | 'number'
  prefix?: string
  onSave: (value: string) => Promise<boolean>
  ariaLabel: string
}) {
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function commit() {
    if (value === initial || saving) return
    setSaving(true)
    const ok = await onSave(value)
    setSaving(false)
    if (!ok) setValue(initial)
  }

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-xs text-[var(--txt3)]">{prefix}</span>}
      <input
        aria-label={ariaLabel}
        type={type}
        step={type === 'number' ? '0.001' : undefined}
        min={type === 'number' ? '0' : undefined}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={cn(fieldClass, saving && 'opacity-50')}
      />
    </div>
  )
}

export function AdminDoctorsManager({ doctors }: { doctors: AdminDoctor[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const awaiting = doctors.filter((d) => !d.isApproved)

  function approve(d: AdminDoctor) {
    setBusyId(d.doctorId)
    startTransition(async () => {
      const res = await setDoctorApproval(d.doctorId, true)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Approval failed', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Doctor approved', description: d.name })
        router.refresh()
      }
      setBusyId(null)
    })
  }

  function saveSpecialty(doctorId: string, name: string) {
    return async (value: string): Promise<boolean> => {
      const res = await updateDoctorDetails(doctorId, { specialty: value })
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not save', description: res.error })
        return false
      }
      toast({ variant: 'success', title: 'Specialty updated', description: name })
      router.refresh()
      return true
    }
  }

  function saveFee(doctorId: string, name: string) {
    return async (value: string): Promise<boolean> => {
      const trimmed = value.trim()
      const fee = trimmed === '' ? null : Number(trimmed)
      if (fee !== null && Number.isNaN(fee)) {
        toast({ variant: 'destructive', title: 'Invalid fee', description: 'Enter a number.' })
        return false
      }
      const res = await updateDoctorDetails(doctorId, { consultationFee: fee })
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not save', description: res.error })
        return false
      }
      toast({ variant: 'success', title: 'Fee updated', description: name })
      router.refresh()
      return true
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending approval */}
      {awaiting.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--amber)] bg-[var(--amber-light)] p-4">
          <h3 className="text-sm font-semibold text-[var(--amber)]">
            Pending approval ({awaiting.length})
          </h3>
          <p className="mt-0.5 text-xs text-[var(--txt2)]">
            These doctors aren&apos;t visible to patients until approved.
          </p>
          <ul className="mt-3 space-y-2">
            {awaiting.map((d) => (
              <li
                key={d.doctorId}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={d.name} src={d.avatarUrl} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--txt)]">{d.name}</p>
                    <p className="truncate text-xs text-[var(--txt3)]">{d.specialty}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 shrink-0 bg-[var(--green)] px-3 text-white hover:opacity-90"
                  disabled={pending && busyId === d.doctorId}
                  onClick={() => approve(d)}
                >
                  {pending && busyId === d.doctorId ? '…' : 'Approve'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All doctors */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--txt3)]">
              <th className="px-4 py-2.5 font-medium">Doctor</th>
              <th className="px-4 py-2.5 font-medium">Specialty</th>
              <th className="px-4 py-2.5 font-medium">Fee</th>
              <th className="px-4 py-2.5 font-medium">Appts</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--txt3)]">
                  No doctors yet.
                </td>
              </tr>
            ) : (
              doctors.map((d) => (
                <tr
                  key={d.doctorId}
                  className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg2)]"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.name} src={d.avatarUrl} size={30} />
                      <span className="font-medium text-[var(--txt)]">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 min-w-[160px]">
                    <EditableField
                      ariaLabel={`Specialty for ${d.name}`}
                      initial={d.specialty}
                      onSave={saveSpecialty(d.doctorId, d.name)}
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[140px]">
                    <EditableField
                      ariaLabel={`Consultation fee for ${d.name}`}
                      type="number"
                      prefix="OMR"
                      initial={d.consultationFee === null ? '' : String(d.consultationFee)}
                      onSave={saveFee(d.doctorId, d.name)}
                    />
                  </td>
                  <td className="px-4 py-2 text-[var(--txt2)]">{d.appointmentCount}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                        d.isApproved
                          ? 'bg-[var(--green-light)] text-[var(--green)]'
                          : 'bg-[var(--amber-light)] text-[var(--amber)]'
                      )}
                    >
                      {d.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      {!d.isApproved && (
                        <Button
                          size="sm"
                          className="h-8 bg-[var(--green)] px-3 text-white hover:opacity-90"
                          disabled={pending && busyId === d.doctorId}
                          onClick={() => approve(d)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={`/admin/doctors/${d.doctorId}/schedule`}>
                          <CalendarDays size={14} />
                          Schedule
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
