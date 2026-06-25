'use client'

import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'destructive'

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

type State = { toasts: ToastItem[] }

const AUTO_DISMISS_MS = 4500

let memory: State = { toasts: [] }
const listeners = new Set<(state: State) => void>()

function emit() {
  for (const listener of listeners) listener(memory)
}

export function dismiss(id: string) {
  memory = { toasts: memory.toasts.filter((t) => t.id !== id) }
  emit()
}

/** Fire a toast from anywhere (client side). */
export function toast(input: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  memory = { toasts: [...memory.toasts, { id, variant: 'default', ...input }] }
  emit()
  setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
  return id
}

export function useToast() {
  const [state, setState] = React.useState<State>(memory)

  React.useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return { toasts: state.toasts, toast, dismiss }
}
