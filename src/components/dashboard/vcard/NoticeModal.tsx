'use client'

import { Modal } from '@/components/ui'
import { cn } from '@/utils/cn'
import { Megaphone, X } from 'lucide-react'
import { useState } from 'react'

export type NoticeType = 'info' | 'warning' | 'success'

type NoticeModalProps = {
  open: boolean
  cardName: string
  initialText: string
  initialType: NoticeType
  deliverySummary?: string
  onClose: () => void
  onSave: (text: string, type: NoticeType) => void
  onClear?: () => void
}

export function NoticeModal({
  open,
  cardName,
  initialText,
  initialType,
  deliverySummary,
  onClose,
  onSave,
  onClear,
}: NoticeModalProps) {
  const [text, setText] = useState(initialText)
  const [type, setType] = useState<NoticeType>(initialType)
  const [saved, setSaved] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setText(initialText)
      setType(initialType)
      setSaved(false)
    }
  }

  const handleSave = () => {
    onSave(text.trim(), type)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 900)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="z-10000"
      className="relative w-full max-w-lg overflow-hidden rounded-4xl border border-slate-200 p-8 shadow-2xl dark:border-white/10 dark:bg-[#0b0f19]"
      labelledBy="notice-modal-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <h2
        id="notice-modal-title"
        className="flex items-center gap-2 pr-10 text-xl font-black text-slate-900 dark:text-white"
      >
        <Megaphone className="h-5 w-5 text-indigo-600" />
        Card notice
      </h2>
      <p className="mt-1 text-xs font-semibold text-slate-400">
        {deliverySummary || `This notice is shown for ${cardName || 'this card'}. Clear the message to remove it.`}
      </p>

      <div className="mt-6 space-y-4">
        <div className="flex gap-3">
          {(['info', 'warning', 'success'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-black tracking-wider uppercase transition-all',
                type === t
                  ? t === 'info'
                    ? 'border-indigo-600 bg-indigo-500 text-white'
                    : t === 'warning'
                      ? 'border-amber-600 bg-amber-500 text-white'
                      : 'border-emerald-600 bg-emerald-500 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-white/5 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Notice message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Action required: Please update your business address details."
            className="min-h-25 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear()
                onClose()
              }}
              className="rounded-xl bg-rose-50 px-4 py-3.5 text-xs font-black tracking-wider text-rose-600 uppercase dark:bg-rose-500/10 dark:text-rose-300"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-3.5 text-xs font-black tracking-wider text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3.5 text-xs font-black tracking-wider text-white uppercase shadow-sm hover:bg-indigo-700 active:scale-95"
          >
            {saved ? 'Notice saved ✓' : 'Save notice'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
