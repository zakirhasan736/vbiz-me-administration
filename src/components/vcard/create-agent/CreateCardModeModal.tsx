'use client'

import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { FilePenLine, Sparkles, X } from 'lucide-react'

type CreateCardModeModalProps = {
  open: boolean
  onClose: () => void
  onChooseAi: () => void
  onChooseManual: () => void
  title?: string
  canUseAi?: boolean
}

export function CreateCardModeModal({
  open,
  onClose,
  onChooseAi,
  onChooseManual,
  title = 'Create a new card',
  canUseAi = true,
}: CreateCardModeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-full max-w-lg space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Generate a complete card with AI, or build it manually tab by tab.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={canUseAi ? onChooseAi : undefined}
          disabled={!canUseAi}
          className={cn(
            'flex items-start gap-4 rounded-3xl border p-5 text-left transition',
            canUseAi
              ? 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10'
              : 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-white/5'
          )}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-sm font-black text-slate-900 dark:text-white">Generate with AI</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">
              {canUseAi
                ? 'Add a website, PDFs or photos, and a short note. We read the site and files first, then the AI builds your card — tabs, about, services, FAQs, and more.'
                : 'Auto card builder is not included in your package.'}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onChooseManual}
          className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-200">
            <FilePenLine className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-sm font-black text-slate-900 dark:text-white">Create manually</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-300">
              Open the full editor and fill Personal, Services, Portfolio, and other tabs yourself.
            </span>
          </span>
        </button>
      </div>
    </Modal>
  )
}
