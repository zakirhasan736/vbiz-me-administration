'use client'

import { Loader } from '@/components/ui/Loader'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { FilePenLine, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

type CreateDestination = 'ai' | 'manual'

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
  const [pending, setPending] = useState<CreateDestination | null>(null)
  const [wasOpen, setWasOpen] = useState(open)
  // Reset loader when the parent closes the modal (avoid setState-in-effect lint).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open && pending) setPending(null)
  }

  const handleClose = () => {
    if (pending) return
    setPending(null)
    onClose()
  }

  const start = (destination: CreateDestination) => {
    if (pending) return
    if (destination === 'ai' && !canUseAi) return
    setPending(destination)
    // Let the loader paint before navigation starts (router.push can feel laggy).
    window.setTimeout(() => {
      if (destination === 'ai') onChooseAi()
      else onChooseManual()
    }, 80)
  }

  const loadingLabel =
    pending === 'ai' ? 'Opening AI card builder…' : pending === 'manual' ? 'Opening card editor…' : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className="relative w-full max-w-lg space-y-6 overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]"
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
          onClick={handleClose}
          disabled={Boolean(pending)}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={cn('grid gap-3', pending && 'pointer-events-none opacity-40')}>
        <button
          type="button"
          onClick={() => start('ai')}
          disabled={!canUseAi || Boolean(pending)}
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
          onClick={() => start('manual')}
          disabled={Boolean(pending)}
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

      {pending && loadingLabel ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-4xl bg-white/85 backdrop-blur-sm dark:bg-[#0b0f19]/90"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader
            className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10"
            iconClassName="h-7 w-7 text-emerald-600 dark:text-emerald-300"
          />
          <p className="text-sm font-black text-slate-900 dark:text-white">{loadingLabel}</p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {pending === 'ai' ? 'Preparing the AI builder…' : 'Preparing the card editor…'}
          </p>
        </div>
      ) : null}
    </Modal>
  )
}
