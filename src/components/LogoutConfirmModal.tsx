'use client'

import { LogOut } from 'lucide-react'

type LogoutConfirmModalProps = {
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function LogoutConfirmModal({ onCancel, onConfirm, isLoading }: LogoutConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div className="animate-in zoom-in-95 w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl duration-200 sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
          <LogOut className="h-7 w-7 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 id="logout-confirm-title" className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">
          Sign out?
        </h3>
        <p className="mb-8 text-center text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          Are you sure you want to sign out of your account?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-[14px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-2xl bg-rose-600 py-3 text-[14px] font-semibold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50 dark:bg-rose-500 dark:hover:bg-rose-600"
          >
            {isLoading ? 'Signing out…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
