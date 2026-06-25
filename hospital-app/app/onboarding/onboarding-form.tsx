'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import type { UserRole } from '@/types/database'
import { dashboardFor } from '@/lib/auth/roles'
import { saveOnboarding } from '@/lib/actions/onboarding'
import {
  doctorOnboardingSchema,
  patientOnboardingSchema,
  type DoctorOnboardingValues,
  type PatientOnboardingValues,
} from '@/lib/validations/auth'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  role: UserRole
  defaults: {
    fullName: string
    phone: string
    specialty?: string
    bio?: string
    consultationFee?: string
  }
}

type FormValues = DoctorOnboardingValues | PatientOnboardingValues

export function OnboardingForm({ role, defaults }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const isDoctor = role === 'doctor'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isDoctor ? doctorOnboardingSchema : patientOnboardingSchema),
    defaultValues: {
      fullName: defaults.fullName,
      phone: defaults.phone,
      ...(isDoctor
        ? {
            specialty: defaults.specialty ?? '',
            bio: defaults.bio ?? '',
            consultationFee: defaults.consultationFee
              ? Number(defaults.consultationFee)
              : undefined,
          }
        : {}),
    } as FormValues,
  })

  const fieldErrors = errors as Record<string, { message?: string } | undefined>

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    const doctorValues = values as DoctorOnboardingValues
    const result = await saveOnboarding({
      fullName: values.fullName,
      phone: values.phone,
      ...(isDoctor
        ? {
            specialty: doctorValues.specialty,
            bio: doctorValues.bio || undefined,
            consultationFee: doctorValues.consultationFee,
          }
        : {}),
    })

    if (result.error) {
      toast({ variant: 'destructive', title: 'Could not save', description: result.error })
      setSubmitting(false)
      return
    }

    toast({ variant: 'success', title: 'Profile saved' })
    router.replace(dashboardFor(role))
  }

  const skip = () => router.replace(dashboardFor(role))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...register('fullName')} />
        {fieldErrors.fullName && (
          <p className="text-xs text-[var(--red)]">{fieldErrors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
        {fieldErrors.phone && (
          <p className="text-xs text-[var(--red)]">{fieldErrors.phone.message}</p>
        )}
      </div>

      {isDoctor && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              placeholder="e.g. Cardiology"
              {...register('specialty')}
            />
            {fieldErrors.specialty && (
              <p className="text-xs text-[var(--red)]">{fieldErrors.specialty.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="consultationFee">Consultation fee</Label>
            <Input
              id="consultationFee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('consultationFee')}
            />
            {fieldErrors.consultationFee && (
              <p className="text-xs text-[var(--red)]">
                {fieldErrors.consultationFee.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">
              Bio <span className="text-[var(--txt3)]">(optional)</span>
            </Label>
            <textarea
              id="bio"
              rows={3}
              placeholder="Share your background and approach to care."
              className="flex w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--txt)] placeholder:text-[var(--txt3)] focus-visible:border-[var(--p)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]"
              {...register('bio')}
            />
            {fieldErrors.bio && (
              <p className="text-xs text-[var(--red)]">{fieldErrors.bio.message}</p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={skip}
          className="text-sm font-medium text-[var(--txt2)] hover:text-[var(--txt)]"
        >
          Skip for now
        </button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Save and continue
        </Button>
      </div>
    </form>
  )
}
