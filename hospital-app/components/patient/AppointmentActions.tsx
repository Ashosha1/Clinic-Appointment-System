'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import type { AppointmentStatus } from '@/types/database'
import { cancelAppointment } from '@/lib/actions/bookAppointment'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/hooks/use-toast'

interface AppointmentActionsProps {
  appointmentId: string
  doctorId: string
  slotDate: string
  startTime: string
  status: AppointmentStatus
  size?: 'sm' | 'default'
}

/** Reschedule + Cancel controls, shown only for upcoming appointments more
 *  than two hours away. */
export function AppointmentActions({
  appointmentId,
  doctorId,
  slotDate,
  startTime,
  status,
  size = 'sm',
}: AppointmentActionsProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const isUpcoming = status === 'pending' || status === 'confirmed'
  const moreThanTwoHours =
    new Date(`${slotDate}T${startTime}`).getTime() - Date.now() > 2 * 60 * 60 * 1000
  if (!isUpcoming || !moreThanTwoHours) return null

  function onCancel() {
    startTransition(async () => {
      const res = await cancelAppointment(appointmentId)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Could not cancel', description: res.error })
      } else {
        toast({ variant: 'success', title: 'Appointment cancelled' })
        setConfirmOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={() =>
            router.push(`/patient/book/${doctorId}?reschedule=${appointmentId}`)
          }
        >
          Reschedule
        </Button>
        <Button variant="destructive" size={size} onClick={() => setConfirmOpen(true)}>
          Cancel
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Cancel this appointment?"
        description="Are you sure? This cannot be undone."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        pending={pending}
        onConfirm={onCancel}
        onClose={() => !pending && setConfirmOpen(false)}
      />
    </>
  )
}
