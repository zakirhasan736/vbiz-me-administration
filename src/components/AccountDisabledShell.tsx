'use client'

import { ACCOUNT_SUSPENDED_MESSAGE } from '@/lib/accountStatus'
import { Ban, Lock } from 'lucide-react'
import type { ReactNode } from 'react'

type AccountDisabledShellProps = {
  children: ReactNode
  /** When true, content is visually locked and non-interactive. */
  locked: boolean
  title?: string
  message?: string
}

/**
 * Renders dashboard content under a clear “disabled” lock layer so suspended
 * users can still see the page but cannot interact with it.
 */
export function AccountDisabledShell({
  children,
  locked,
  title = 'Account suspended',
  message = ACCOUNT_SUSPENDED_MESSAGE,
}: AccountDisabledShellProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none opacity-40 grayscale-[0.35] select-none" aria-hidden>
        {children}
      </div>

      <div
        className="absolute inset-0 z-40 flex items-start justify-center overflow-auto bg-slate-50/70 px-4 py-10 backdrop-blur-[2px] sm:py-14 dark:bg-black/60"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="account-disabled-title"
        aria-describedby="account-disabled-desc"
      >
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-xl shadow-rose-950/10 sm:p-8 dark:border-rose-500/35 dark:bg-[#0b0f19] dark:shadow-black/40">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <Ban className="h-6 w-6" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-rose-700 uppercase dark:bg-rose-500/15 dark:text-rose-300">
                <Lock className="h-3 w-3" />
                Disabled
              </div>
              <h2
                id="account-disabled-title"
                className="text-xl font-black tracking-tight text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              <p
                id="account-disabled-desc"
                className="mt-2 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-200"
              >
                {message}
              </p>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                <li className="flex gap-2">
                  <span className="text-rose-500 dark:text-rose-400">•</span>
                  Dashboard, vCards, and settings actions are locked
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 dark:text-rose-400">•</span>
                  Password, avatar, and account changes are unavailable
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 dark:text-rose-400">•</span>
                  You can still sign out from the profile menu
                </li>
              </ul>
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                Contact an administrator to restore access. Until then, this area stays disabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
