'use client'

import { Button, Modal, Select, Textarea } from '@/components/ui'
import { AlertCircle, ArrowUpRight, Check, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

type ContactModalProps = {
  onClose: () => void
}

export function ContactModal({ onClose }: ContactModalProps) {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <Modal open onClose={onClose} className="max-w-sm rounded-4xl border-emerald-500/20 p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Message Sent</h3>
        <p className="mb-8 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          Our support team will get back to you shortly.
        </p>
        <Button type="button" variant="dark" size="lg" onClick={onClose} className="w-full">
          Close
        </Button>
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} className="max-w-md overflow-hidden">
      <div className="flex items-center justify-between border-b-0 p-6 sm:px-8 sm:pt-8">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <span className="bg-primary-50 dark:bg-primary-500/10 flex h-8 w-8 items-center justify-center rounded-full">
            <MessageCircle className="text-primary-600 dark:text-primary-400 h-4 w-4" />
          </span>
          Contact Support
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-slate-50 dark:bg-slate-800"
        >
          <X className="h-4 w-4 text-slate-500" />
        </Button>
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
            <Select className="cursor-pointer rounded-xl dark:bg-slate-800/50">
              <option>Order Status Inquiry</option>
              <option>Report an Issue</option>
              <option>Other</option>
            </Select>
          </div>
          <div className="group flex flex-col space-y-2">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Message</label>
            <Textarea
              placeholder="How can we help you?"
              className="min-h-30 resize-none rounded-xl dark:bg-slate-800/50"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setSent(true)}
          rightIcon={ArrowUpRight}
          className="shadow-primary-500/20 w-full rounded-xl px-6 py-4 font-bold"
        >
          Send Message
        </Button>
      </div>
    </Modal>
  )
}
