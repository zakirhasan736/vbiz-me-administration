'use client'

import { cn } from '@/utils/cn'
import { AlertCircle, ArrowUpRight, Check, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

type ContactModalProps = {
  onClose: () => void
}

export function ContactModal({ onClose }: ContactModalProps) {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/80">
        <div className="animate-in zoom-in-95 w-full max-w-sm rounded-[32px] border border-emerald-500/20 bg-white p-8 text-center shadow-2xl duration-500 dark:bg-[#0b0f19]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Message Sent</h3>
          <p className="mb-8 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Our support team will get back to you shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-900 py-3 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]">
        <div className="flex items-center justify-between border-b-0 p-6 sm:px-8 sm:pt-8">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <span className="bg-primary-50 dark:bg-primary-500/10 flex h-8 w-8 items-center justify-center rounded-full">
              <MessageCircle className="text-primary-600 dark:text-primary-400 h-4 w-4" />
            </span>
            Contact Support
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-6 p-6 sm:px-8 sm:pb-8">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <p className="text-[13px] leading-relaxed font-medium text-amber-800 dark:text-amber-200/80">
              If your order has passed the 24 hour mark, please let us know and we will prioritize it immediately.
            </p>
          </div>

          <div className="space-y-5 text-sm">
            <div className="group flex flex-col space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Subject</label>
              <div className="relative">
                <select className="focus:border-primary-500 focus:ring-primary-500 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-900 transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800/50 dark:text-white">
                  <option>Order Status Inquiry</option>
                  <option>Report an Issue</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="group flex flex-col space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                placeholder="How can we help you?"
                className="focus:border-primary-500 focus:ring-primary-500 min-h-[120px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-medium text-slate-900 transition-all outline-none focus:ring-1 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
              ></textarea>
            </div>
          </div>

          <button
            onClick={() => setSent(true)}
            className={cn(
              'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-[14px] font-bold text-white shadow-sm transition-all active:scale-95'
            )}
          >
            Send Message <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
