'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { updateDoctorProfile } from '@/lib/actions/doctor-profile'
import { BUFFER_OPTIONS, type BufferMinutes } from '@/types/scheduling'

interface DoctorProfileFormProps {
  doctorId: string
  userId: string
  initial: {
    fullName: string
    phone: string
    avatarUrl: string | null
    specialty: string
    bio: string
    consultationFee: number | null
    bufferMinutes: number
    isActive: boolean
  }
}

export function DoctorProfileForm({ doctorId, userId, initial }: DoctorProfileFormProps) {
  const [fullName, setFullName] = useState(initial.fullName)
  const [phone, setPhone] = useState(initial.phone)
  const [specialty, setSpecialty] = useState(initial.specialty)
  const [bio, setBio] = useState(initial.bio)
  const [fee] = useState(initial.consultationFee?.toString() ?? '')
  const [buffer, setBuffer] = useState<BufferMinutes>(
    (BUFFER_OPTIONS.includes(initial.bufferMinutes as BufferMinutes)
      ? initial.bufferMinutes
      : 0) as BufferMinutes
  )
  const [isActive, setIsActive] = useState(initial.isActive)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/avatar-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message })
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    setUploading(false)
    toast({ variant: 'success', title: 'Photo updated' })
  }

  function onSave() {
    startTransition(async () => {
      const res = await updateDoctorProfile(doctorId, {
        fullName,
        phone,
        specialty,
        bio,
        avatarUrl,
        bufferMinutes: buffer,
        isActive,
      })
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not save', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Profile saved' })
      }
    })
  }

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[var(--bg3)] text-lg font-medium text-[var(--txt2)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials || '—'
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--p)] text-white shadow-card transition-colors hover:bg-[var(--p2)]"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickAvatar}
            className="hidden"
          />
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--txt)]">Profile photo</div>
          <div className="text-xs text-[var(--txt3)]">JPG or PNG, shown to patients.</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Specialty">
          <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </Field>
        <Field label="Consultation fee (OMR)">
          <Input
            type="number"
            value={fee}
            readOnly
            disabled
            placeholder="Not set"
            aria-describedby="fee-note"
            className="cursor-not-allowed opacity-70"
          />
          <p id="fee-note" className="text-xs text-[var(--txt3)]">
            Set by admin.
          </p>
        </Field>
      </div>

      <Field label="Bio">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="flex w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--txt)] transition-colors placeholder:text-[var(--txt3)] focus-visible:border-[var(--p)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
          placeholder="Tell patients about your experience and approach."
        />
      </Field>

      <Field label="Buffer time between appointments">
        <select
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value) as BufferMinutes)}
          className="h-10 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--txt)]"
        >
          {BUFFER_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m === 0 ? 'No buffer' : `${m} min`}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex items-start justify-between gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-4">
        <div>
          <div className="text-sm font-medium text-[var(--txt)]">Accept new bookings</div>
          <div className="text-xs text-[var(--txt3)]">
            When off, patients can’t request new appointments with you.
          </div>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Accept new bookings" />
      </div>

      {!isActive && (
        <p className="text-xs text-[var(--red)]">
          New bookings are paused. Existing appointments are unaffected.
        </p>
      )}

      <Button onClick={onSave} disabled={pending || uploading} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-1.5')}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
