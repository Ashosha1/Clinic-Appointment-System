'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { updatePatientProfile } from '@/lib/actions/patient-profile'

interface PatientProfileFormProps {
  userId: string
  email?: string | null
  initial: {
    fullName: string
    phone: string
    avatarUrl: string | null
  }
}

export function PatientProfileForm({ userId, email, initial }: PatientProfileFormProps) {
  const [fullName, setFullName] = useState(initial.fullName)
  const [phone, setPhone] = useState(initial.phone)
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
      const res = await updatePatientProfile({ fullName, phone, avatarUrl })
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
          <div className="text-xs text-[var(--txt3)]">JPG or PNG.</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      {email && (
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled />
          <p className="text-xs text-[var(--txt3)]">Email can’t be changed here.</p>
        </div>
      )}

      <Button onClick={onSave} disabled={pending || uploading} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save profile'}
      </Button>
    </div>
  )
}
