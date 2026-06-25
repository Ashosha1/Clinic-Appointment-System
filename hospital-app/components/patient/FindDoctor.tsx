'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import type { DoctorListing } from '@/lib/actions/patient-data'
import { dateKey } from '@/lib/scheduling/time'
import { Input } from '@/components/ui/input'
import { DoctorCard } from '@/components/patient/DoctorCard'

type Availability = 'any' | 'today' | 'week'

export function FindDoctor({ doctors }: { doctors: DoctorListing[] }) {
  const specialties = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialty))).sort(),
    [doctors]
  )
  const maxFee = useMemo(
    () => Math.max(50, ...doctors.map((d) => d.consultation_fee)),
    [doctors]
  )

  const [query, setQuery] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [availability, setAvailability] = useState<Availability>('any')
  const [feeCap, setFeeCap] = useState(maxFee)

  const today = dateKey(new Date())
  const weekEnd = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return dateKey(d)
  })()

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const filtered = doctors.filter((d) => {
    const q = query.trim().toLowerCase()
    if (q && !d.name.toLowerCase().includes(q) && !d.specialty.toLowerCase().includes(q)) {
      return false
    }
    if (selectedSpecialties.size > 0 && !selectedSpecialties.has(d.specialty)) return false
    if (d.consultation_fee > feeCap) return false
    if (availability !== 'any') {
      if (!d.next_slot) return false
      if (availability === 'today' && d.next_slot.date !== today) return false
      if (availability === 'week' && d.next_slot.date > weekEnd) return false
    }
    return true
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--txt2)]">Specialty</h3>
          {specialties.length === 0 && (
            <p className="text-xs text-[var(--txt3)]">None yet</p>
          )}
          <div className="space-y-1.5">
            {specialties.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-[var(--txt2)]">
                <input
                  type="checkbox"
                  checked={selectedSpecialties.has(s)}
                  onChange={() => toggleSpecialty(s)}
                  className="h-3.5 w-3.5 accent-[var(--p)]"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--txt2)]">Availability</h3>
          <div className="space-y-1.5">
            {(
              [
                ['any', 'Any time'],
                ['today', 'Today'],
                ['week', 'This week'],
              ] as [Availability, string][]
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-[var(--txt2)]">
                <input
                  type="radio"
                  name="availability"
                  checked={availability === value}
                  onChange={() => setAvailability(value)}
                  className="h-3.5 w-3.5 accent-[var(--p)]"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[var(--txt2)]">
            Max fee: OMR {feeCap.toFixed(3)}
          </h3>
          <input
            type="range"
            min={0}
            max={maxFee}
            step={1}
            value={feeCap}
            onChange={(e) => setFeeCap(Number(e.target.value))}
            className="w-full accent-[var(--p)]"
          />
        </div>
      </aside>

      <div className="space-y-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialty"
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--border)] py-12 text-center text-sm text-[var(--txt3)]">
            No doctors match your search. Try adjusting your filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
