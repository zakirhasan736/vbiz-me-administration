'use client'

import { Modal } from '@/components/ui/Modal'
import { useState, type ReactNode } from 'react'

type PromptModalProps = {
  open: boolean
  title: string
  description?: ReactNode
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
  labelledBy?: string
  describedBy?: string
}

export function PromptModal({
  open,
  title,
  description,
  label,
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  labelledBy = 'prompt-modal-title',
  describedBy = 'prompt-modal-description',
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setValue(defaultValue)
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy={labelledBy}
      describedBy={describedBy}
      className="max-w-md p-6 sm:p-8"
    >
      <h3 id={labelledBy} className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description ? (
        <p
          id={describedBy}
          className="mb-5 text-center text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400"
        >
          {description}
        </p>
      ) : null}
      {label ? (
        <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
          {label}
        </label>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mb-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(value)}
          className="flex-1 rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
