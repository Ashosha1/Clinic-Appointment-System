'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  tabs: TabItem[]
  defaultValue?: string
  children: (active: string) => React.ReactNode
  className?: string
}

/** Lightweight controlled-by-state tabs. `children` is a render function. */
export function Tabs({ tabs, defaultValue, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value)

  return (
    <div className={className}>
      <div
        role="tablist"
        className="inline-flex gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg2)] p-1"
      >
        {tabs.map((tab) => {
          const selected = tab.value === active
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.value)}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'bg-[var(--card)] text-[var(--txt)] shadow-card'
                  : 'text-[var(--txt2)] hover:text-[var(--txt)]'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="mt-5">{children(active)}</div>
    </div>
  )
}
