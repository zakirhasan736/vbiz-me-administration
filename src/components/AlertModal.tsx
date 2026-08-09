'use client'

import { Modal } from '@/components/ui/Modal'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AlertModalProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  onClose: () => void
  variant?: 'default' | 'danger' | 'success'
  icon?: LucideIcon
  labelledBy?: string
  describedBy?: string
}

export function AlertModal({
  open,
  title,
  description,
  confirmLabel = 'OK',
  onClose,
  variant = 'default',
  icon: Icon,
  labelledBy = 'alert-modal-title',
  describedBy = 'alert-modal-description',
}: AlertModalProps) {
  const tone =
    variant === 'danger'
      ? {
          wrap: 'bg-rose-50 dark:bg-rose-500/10',
          icon: 'text-rose-600 dark:text-rose-400',
          btn: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white',
        }
      : variant === 'success'
        ? {
            wrap: 'bg-emerald-50 dark:bg-emerald-500/10',
            icon: 'text-emerald-600 dark:text-emerald-400',
            btn: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white',
          }
        : {
            wrap: 'bg-slate-100 dark:bg-white/10',
            icon: 'text-slate-700 dark:text-slate-200',
            btn: 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white',
          }

  return (
    <Modal open={open} onClose={onClose} labelledBy={labelledBy} describedBy={describedBy} className="p-6 sm:p-8">
      {Icon ? (
        <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.wrap}`}>
          <Icon className={`h-7 w-7 ${tone.icon}`} />
        </div>
      ) : null}
      <h3 id={labelledBy} className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p
        id={describedBy}
        className="mb-8 text-center text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400"
      >
        {description}
      </p>
      <button
        type="button"
        onClick={onClose}
        className={`w-full rounded-2xl py-3 text-[14px] font-semibold transition-all active:scale-[0.98] ${tone.btn}`}
      >
        {confirmLabel}
      </button>
    </Modal>
  )
}
