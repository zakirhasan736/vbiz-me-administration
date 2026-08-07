'use client'

import { Modal } from '@/components/ui/Modal'
import { Loader, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type ConfirmModalProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  /** Visual tone for the confirm action */
  variant?: 'danger' | 'default'
  icon?: LucideIcon
  labelledBy?: string
  describedBy?: string
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'default',
  icon: Icon,
  labelledBy = 'confirm-modal-title',
  describedBy = 'confirm-modal-description',
}: ConfirmModalProps) {
  const isDanger = variant === 'danger'

  return (
    <Modal
      open={open}
      onClose={onCancel}
      preventClose={isLoading}
      labelledBy={labelledBy}
      describedBy={describedBy}
      className="p-6 sm:p-8"
    >
      {Icon ? (
        <div
          className={
            isDanger
              ? 'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10'
              : 'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10'
          }
        >
          <Icon
            className={
              isDanger ? 'h-7 w-7 text-rose-600 dark:text-rose-400' : 'h-7 w-7 text-slate-700 dark:text-slate-200'
            }
          />
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
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={
            isDanger
              ? 'flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-[14px] font-semibold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-600'
              : 'flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          }
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              {loadingLabel || confirmLabel}
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  )
}
