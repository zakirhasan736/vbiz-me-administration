'use client'

import { TOAST_EVENT, type ToastPayload, type ToastVariant } from '@/lib/toast/toast'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION = 4500
const MAX_VISIBLE = 4

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof Info; accent: string; iconClass: string; ring: string }> = {
  success: {
    icon: CheckCircle2,
    accent: '#22c55e',
    iconClass: 'text-green-500',
    ring: 'ring-green-500/20',
  },
  error: {
    icon: XCircle,
    accent: '#ef4444',
    iconClass: 'text-red-500',
    ring: 'ring-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    accent: '#f59e0b',
    iconClass: 'text-amber-500',
    ring: 'ring-amber-500/20',
  },
  info: {
    icon: Info,
    accent: '#3b82f6',
    iconClass: 'text-blue-500',
    ring: 'ring-blue-500/20',
  },
}

function ToastPill({ toast, onDismiss }: { toast: ToastPayload; onDismiss: (id: string) => void }) {
  const variant = VARIANT_STYLES[toast.variant]
  const Icon = variant.icon

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION
    const timer = window.setTimeout(() => onDismiss(toast.id), duration)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative flex w-full max-w-[360px] items-start gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 p-3.5 pr-9 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ring-1 ${variant.ring} backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: variant.accent }} />

      <span className={`mt-0.5 shrink-0 ${variant.iconClass}`}>
        <Icon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        {toast.title ? <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{toast.title}</p> : null}
        <p
          className={`text-sm leading-snug ${toast.title ? 'mt-0.5 text-zinc-600 dark:text-zinc-400' : 'font-semibold text-zinc-800 dark:text-zinc-100'}`}
        >
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute top-2.5 right-2.5 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

/** Site-wide toast renderer. Mount once at the root layout. */
export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])
  const seenRef = useRef<Set<string>>(new Set())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail
      if (!detail?.message) return
      if (seenRef.current.has(detail.id)) return
      seenRef.current.add(detail.id)

      setToasts((prev) => {
        const next = [...prev, detail]
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next
      })
    }

    window.addEventListener(TOAST_EVENT, handle)
    return () => window.removeEventListener(TOAST_EVENT, handle)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[300] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-5 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastPill key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
