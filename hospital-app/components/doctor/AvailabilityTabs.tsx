'use client'

import { Tabs } from '@/components/ui/tabs'
import { AvailabilityBuilder } from '@/components/doctor/AvailabilityBuilder'
import { BlockDatesManager } from '@/components/doctor/BlockDatesManager'
import type { DayScheduleInput } from '@/types/scheduling'

interface BlockedEntry {
  date: string
  reason: string | null
}

interface AvailabilityTabsProps {
  doctorId: string
  initialSlots: DayScheduleInput[]
  blocked: BlockedEntry[]
}

/**
 * Client wrapper around Tabs. The Tabs API uses a render-function child, which
 * cannot be passed from a Server Component — so the render function lives here.
 */
export function AvailabilityTabs({ doctorId, initialSlots, blocked }: AvailabilityTabsProps) {
  return (
    <Tabs
      tabs={[
        { value: 'weekly', label: 'Weekly schedule' },
        { value: 'blocked', label: 'Block dates' },
      ]}
      defaultValue="weekly"
    >
      {(active) =>
        active === 'weekly' ? (
          <AvailabilityBuilder doctorId={doctorId} initial={initialSlots} />
        ) : (
          <BlockDatesManager doctorId={doctorId} initial={blocked} />
        )
      }
    </Tabs>
  )
}
