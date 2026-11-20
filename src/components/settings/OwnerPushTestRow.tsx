'use client'

import { Button } from '@/components/ui'
import { shouldShowIosHomeScreenPushGuide } from '@/lib/push/iosPushGuidance'
import { sendOwnerTestPush } from '@/lib/push/registerOwnerPush'
import { cn } from '@/utils/cn'
import { BellRing } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const TEST_DELAY_SECONDS = 10

const subscribeNoop = () => () => {}

type Status = { tone: 'info' | 'success' | 'error'; text: string } | null

/**
 * Settings → Notifications: lets the owner confirm lock-screen alerts work on this device.
 * Registers the device as an owner push target, then the server sends a test alert after
 * a short delay so the owner can lock the phone or close vBiz Me first.
 */
export function OwnerPushTestRow() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [countdown, setCountdown] = useState(0)
  // Device check is client-only; server render assumes no iPhone guide (no hydration mismatch).
  const iosNeedsHomeScreen = useSyncExternalStore(subscribeNoop, shouldShowIosHomeScreenPushGuide, () => false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timer.current), [])

  const startCountdown = (seconds: number) => {
    window.clearInterval(timer.current)
    setCountdown(seconds)
    timer.current = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer.current)
          return 0
        }
        return value - 1
      })
    }, 1000)
  }

  const runTest = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const result = await sendOwnerTestPush(TEST_DELAY_SECONDS)
      if (!result.ok) {
        setStatus({ tone: 'error', text: result.message })
        return
      }
      startCountdown(result.delaySeconds)
      setStatus({
        tone: 'success',
        text: `Test alert on its way in ${result.delaySeconds} seconds. Lock your phone or close vBiz Me now — it should appear on your lock screen.${
          result.devices > 1 ? ` It also goes to your other ${result.devices - 1} registered device(s).` : ''
        }`,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[20px] border border-slate-200/70 p-4 dark:border-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h4 className="mb-0.5 text-[14px] font-bold text-slate-900 dark:text-white">Test lock-screen alert</h4>
          <p className="text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            Sends a test alert to this device in {TEST_DELAY_SECONDS} seconds, so you can lock your phone and confirm
            alerts arrive while vBiz Me is closed.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={BellRing}
          loading={busy}
          disabled={busy || countdown > 0}
          onClick={() => void runTest()}
        >
          {countdown > 0 ? `Arriving in ${countdown}s` : 'Send test alert'}
        </Button>
      </div>

      {iosNeedsHomeScreen ? (
        <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          iPhone: alerts only work from the Home Screen app. In Safari tap Share → Add to Home Screen, open vBiz Me from
          that icon, sign in, and allow notifications.
        </p>
      ) : null}

      {status ? (
        <p
          role="status"
          className={cn(
            'mt-3 rounded-xl border px-3 py-2 text-xs font-semibold',
            status.tone === 'success' &&
              'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
            status.tone === 'error' &&
              'border-red-200/80 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
            status.tone === 'info' &&
              'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
          )}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  )
}
