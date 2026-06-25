'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'How far in advance can I book an appointment?',
    a: 'You can book any open slot up to 60 days ahead. Doctors publish their real-time availability, so you only ever see times you can actually take.',
  },
  {
    q: 'What happens if I need to cancel last minute?',
    a: 'Cancel from your appointment details at any time. The slot is released instantly so another patient can take it, and the clinic is notified automatically.',
  },
  {
    q: 'Can I reschedule instead of cancelling?',
    a: 'Yes. Rescheduling keeps your place in the doctor’s care queue — pick a new open slot and your old time is freed in a single step.',
  },
  {
    q: 'Is my health data secure?',
    a: 'MediConnect is built HIPAA-ready. Data is encrypted in transit and at rest, and access is scoped by role so only you and your care team can see your records.',
  },
  {
    q: 'Does MediConnect work on mobile?',
    a: 'Completely. The booking flow, dashboards, and history are fully responsive and work on any phone, tablet, or desktop with no app to install.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto mt-10 max-w-2xl space-y-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-[var(--txt)]"
            >
              {item.q}
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 text-[var(--txt2)] transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--txt2)]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
