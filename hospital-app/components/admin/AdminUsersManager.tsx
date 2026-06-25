'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { Avatar } from '@/components/shared/Avatar'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { setProfileActive, setDoctorApproval } from '@/lib/actions/admin'
import type { AdminUser } from '@/lib/actions/admin-data'

const TABS = ['patients', 'doctors', 'all'] as const
type Tab = (typeof TABS)[number]
const TAB_LABEL: Record<Tab, string> = { patients: 'Patients', doctors: 'Doctors', all: 'All' }

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Admin',
}

const inputClass =
  'h-9 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--txt)] outline-none focus:ring-2 focus:ring-[var(--p)]'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatFee(fee: number | null): string {
  return fee === null ? '—' : `OMR ${fee.toFixed(3)}`
}

export function AdminUsersManager({ users }: { users: AdminUser[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('patients')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<AdminUser | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (tab === 'patients' && u.role !== 'patient') return false
      if (tab === 'doctors' && u.role !== 'doctor') return false
      if (q) {
        const hay = `${u.name} ${u.email ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [users, tab, query])

  function withBusy(id: string, fn: () => Promise<void>) {
    setBusyId(id)
    startTransition(async () => {
      await fn()
      setBusyId(null)
    })
  }

  function toggleActive(u: AdminUser) {
    withBusy(u.profileId, async () => {
      const res = await setProfileActive(u.profileId, !u.isActive)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Action failed', description: res.error })
      } else {
        toast({
          variant: 'success',
          title: u.isActive ? 'Account suspended' : 'Account activated',
          description: u.name,
        })
        router.refresh()
      }
    })
  }

  function approveDoctor(u: AdminUser) {
    if (!u.doctorId) return
    withBusy(u.profileId, async () => {
      const res = await setDoctorApproval(u.doctorId!, true)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Approval failed', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Doctor approved', description: u.name })
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg2)] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-[6px] px-3 py-1 text-xs font-medium transition-colors',
                tab === t
                  ? 'bg-[var(--card)] text-[var(--txt)] shadow-card'
                  : 'text-[var(--txt2)] hover:text-[var(--txt)]'
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className={cn(inputClass, 'pl-8')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--txt3)]">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              <th className="px-4 py-2.5 font-medium">Appts</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--txt3)]">
                  No users match.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isBusy = pending && busyId === u.profileId
                const needsApproval = u.role === 'doctor' && u.doctorApproved === false
                return (
                  <tr
                    key={u.profileId}
                    className="border-t border-[var(--border)] transition-colors hover:bg-[var(--bg2)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.avatarUrl} size={30} />
                        <span className="font-medium text-[var(--txt)]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--txt2)]">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--txt2)]">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3 text-[var(--txt2)]">{formatDate(u.joined)}</td>
                    <td className="px-4 py-3 text-[var(--txt2)]">{u.appointmentCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                          u.isActive
                            ? 'bg-[var(--green-light)] text-[var(--green)]'
                            : 'bg-[var(--red-light)] text-[var(--red)]'
                        )}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setViewing(u)}
                        >
                          View
                        </Button>
                        {needsApproval && (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => approveDoctor(u)}
                            className="h-8 bg-[var(--green)] px-3 text-white hover:opacity-90"
                          >
                            Approve
                          </Button>
                        )}
                        {u.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => toggleActive(u)}
                            className={cn(
                              'h-8',
                              u.isActive
                                ? 'border-[var(--red)] text-[var(--red)] hover:bg-[var(--red-light)]'
                                : 'border-[var(--green)] text-[var(--green)] hover:bg-[var(--green-light)]'
                            )}
                          >
                            {isBusy ? '…' : u.isActive ? 'Suspend' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View profile slide-out */}
      <Sheet open={viewing !== null} onClose={() => setViewing(null)} title="User profile">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} src={viewing.avatarUrl} size={56} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--txt)]">
                  {viewing.name}
                </p>
                <p className="text-sm text-[var(--txt2)]">{ROLE_LABEL[viewing.role]}</p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <Detail label="Email" value={viewing.email ?? '—'} />
              <Detail label="Joined" value={formatDate(viewing.joined)} />
              <Detail label="Status" value={viewing.isActive ? 'Active' : 'Suspended'} />
              <Detail label="Appointments" value={String(viewing.appointmentCount)} />
              {viewing.role === 'doctor' && (
                <>
                  <Detail label="Specialty" value={viewing.specialty ?? '—'} />
                  <Detail label="Consultation fee" value={formatFee(viewing.consultationFee)} />
                  <Detail
                    label="Practice approval"
                    value={viewing.doctorApproved ? 'Approved' : 'Pending'}
                  />
                </>
              )}
            </dl>

            {viewing.role !== 'admin' && (
              <div className="flex gap-2 border-t border-[var(--border)] pt-4">
                {viewing.role === 'doctor' && viewing.doctorApproved === false && (
                  <Button
                    className="flex-1 bg-[var(--green)] text-white hover:opacity-90"
                    disabled={pending}
                    onClick={() => {
                      approveDoctor(viewing)
                      setViewing(null)
                    }}
                  >
                    Approve doctor
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={cn(
                    'flex-1',
                    viewing.isActive
                      ? 'border-[var(--red)] text-[var(--red)] hover:bg-[var(--red-light)]'
                      : 'border-[var(--green)] text-[var(--green)] hover:bg-[var(--green-light)]'
                  )}
                  disabled={pending}
                  onClick={() => {
                    toggleActive(viewing)
                    setViewing(null)
                  }}
                >
                  {viewing.isActive ? 'Suspend account' : 'Activate account'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--txt3)]">{label}</dt>
      <dd className="truncate text-right font-medium text-[var(--txt)]">{value}</dd>
    </div>
  )
}
