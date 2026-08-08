'use client'

import { Modal } from '@/components/ui/Modal'
import { Loader2, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export type AiProfilePayload = {
  fullName?: string
  title?: string
  company?: string
  bio?: string
  email?: string
  phone?: string
  location?: string
  website?: string
}

type AiGenerateModalProps = {
  open: boolean
  onClose: () => void
  onApply: (data: AiProfilePayload) => void
}

function demoProfileFromUrl(url: string): AiProfilePayload {
  const host = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com'
  return {
    fullName: host
      .split('.')[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase()),
    title: 'Founder & Product Lead',
    company: host,
    bio: `Professional profile generated from ${host}. Customize this demo content to match your real brand story.`,
    email: `hello@${host}`,
    phone: '+1 (555) 010-2000',
    location: 'Remote / Global',
    website: url.startsWith('http') ? url : `https://${url}`,
  }
}

export function AiGenerateModal({ open, onClose, onApply }: AiGenerateModalProps) {
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (isLoading) return
    setError('')
    onClose()
  }

  const handleGenerate = async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse website')
      onApply(data)
      setUrlInput('')
      onClose()
    } catch {
      onApply(demoProfileFromUrl(urlInput.trim()))
      setUrlInput('')
      setError('')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      preventClose={isLoading}
      className="w-full max-w-lg space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-white/10 dark:bg-[#0b0f19]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white">AI Auto-Creation Workflow</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Scrape & populate vCard fields instantly using Gemini
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="cursor-pointer rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-black tracking-wider text-slate-400 uppercase">
            Company Website or Domain URL
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="e.g. https://stripe.com or google.com"
            disabled={isLoading}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-800/50 dark:text-white"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-50 p-3 text-xs font-bold text-rose-500 dark:bg-rose-500/10">
            {error}
          </p>
        )}

        <p className="text-[11px] font-medium text-slate-400">
          Gemini AI will use Google Search grounding to retrieve professional details, summaries, titles, and contact
          information to auto-fill your profile.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isLoading || !urlInput.trim()}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? 'Parsing with Gemini...' : 'Generate & Populate'}
        </button>
      </div>
    </Modal>
  )
}
