'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { createUserAsAdmin } from '@/lib/actions/admin'
import { generateTempPassword } from '@/lib/password'

type Role = 'doctor' | 'admin'

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  specialty: '',
}

/** Admin-only "Add user" flow: creates a doctor or admin and emails their
 *  login credentials. Opens as a modal from the Doctors management page. */
export function AddUserDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>('doctor')
  const [form, setForm] = useState(EMPTY)
  const [password, setPassword] = useState(generateTempPassword())
  const [pending, startTransition] = useTransition()

  function reset() {
    setForm(EMPTY)
    setRole('doctor')
    setPassword(generateTempPassword())
  }

  function close() {
    if (pending) return
    setOpen(false)
  }

  function submit() {
    startTransition(async () => {
      const res = await createUserAsAdmin({
        fullName: form.fullName,
        email: form.email,
        role,
        password,
        phone: form.phone || undefined,
        specialty: role === 'doctor' ? form.specialty : undefined,
      })
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not add user', description: res.error })
        return
      }
      toast({
        variant: 'success',
        title: `${role === 'doctor' ? 'Doctor' : 'Admin'} added`,
        description: `Login details emailed to ${form.email}.`,
      })
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} aria-hidden="true" />
        Add doctor
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add a new user"
            className="relative w-full max-w-md rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-xl"
          >
            <h2 className="text-[15px] font-medium text-[var(--txt)]">Add a new user</h2>
            <p className="mt-1 text-sm text-[var(--txt2)]">
              The account is created instantly and login details are emailed to them.
            </p>

            <div className="mt-4 space-y-3">
              <Field label="Role">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--txt)]"
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              <Field label="Full name">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Dr. Jane Smith"
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@clinic.com"
                />
              </Field>

              {role === 'doctor' && (
                <Field label="Specialization">
                  <Input
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="e.g. Cardiology"
                  />
                </Field>
              )}

              <Field label="Phone (optional)">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+968 0000 0000"
                />
              </Field>

              <Field label="Temporary password">
                <div className="flex gap-2">
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Generate a new password"
                    onClick={() => setPassword(generateTempPassword())}
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>
                <p className="text-xs text-[var(--txt3)]">
                  Sent in the welcome email. They can change it after signing in.
                </p>
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={pending}>
                {pending ? 'Adding…' : 'Add and send invite'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
