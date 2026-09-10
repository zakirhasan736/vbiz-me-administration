'use client'

import { Share, Smartphone } from 'lucide-react'

type HomeScreenPushStepsProps = {
  className?: string
  /** iOS = required; Android = optional backup after Allow */
  variant?: 'ios' | 'ios-chrome' | 'android-backup'
}

/** Home Screen steps — required on iPhone; optional backup on Android. */
export function IosPushHomeScreenSteps({ className = '', variant = 'ios' }: HomeScreenPushStepsProps) {
  const isAndroidBackup = variant === 'android-backup'
  const isIosChrome = variant === 'ios-chrome'

  return (
    <div
      className={`vbiz-description space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-[12px] leading-relaxed ${className}`}
    >
      <p className="flex items-start gap-2 font-semibold">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
        {isAndroidBackup
          ? 'Recommended backup: Add to Home Screen'
          : isIosChrome
            ? 'Chrome on iPhone: Allow + Home Screen'
            : 'iPhone setup (Safari or Chrome)'}
      </p>
      {isAndroidBackup ? (
        <>
          <p className="text-[11px] opacity-90">
            Allow notifications in Chrome first — that works. Adding to Home Screen is an extra backup for one-tap
            access and more reliable alerts.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open the Chrome menu (⋮)</li>
            <li>
              Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>
            </li>
            <li>Confirm, then open the card from the Home Screen icon anytime</li>
          </ol>
        </>
      ) : isIosChrome ? (
        <>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Tap <strong>Allow &amp; continue setup</strong> below and choose <strong>Allow</strong> in Chrome
            </li>
            <li className="flex flex-wrap items-center gap-1">
              Then tap <Share className="inline h-3.5 w-3.5" aria-hidden /> <strong>Share</strong> →{' '}
              <strong>Add to Home Screen</strong>
            </li>
            <li>
              Open this card from the <strong>Home Screen icon</strong>
            </li>
            <li>
              Tap <strong>Enable</strong> again if asked, and choose <strong>Allow</strong>
            </li>
          </ol>
          <p className="pt-1 text-[11px] opacity-80">
            Chrome on iPhone can show Allow in the browser. Home Screen is still required so push keeps working.
          </p>
        </>
      ) : (
        <>
          <ol className="list-decimal space-y-2 pl-5">
            <li className="flex flex-wrap items-center gap-1">
              Tap <Share className="inline h-3.5 w-3.5" aria-hidden /> <strong>Share</strong>
            </li>
            <li>
              Tap <strong>Add to Home Screen</strong>, then Add
            </li>
            <li>
              Open this card from the <strong>Home Screen icon</strong> (not the browser tab)
            </li>
            <li>
              Tap <strong>Enable</strong> and choose <strong>Allow</strong> if asked
            </li>
          </ol>
          <p className="pt-1 text-[11px] opacity-80">
            Safari may not show Allow in the tab — that&apos;s OK. Home Screen first, then Allow from the icon.
          </p>
        </>
      )}
    </div>
  )
}

/** @deprecated Use IosPushHomeScreenSteps with variant */
export function AndroidHomeScreenBackupSteps({ className = '' }: { className?: string }) {
  return <IosPushHomeScreenSteps className={className} variant="android-backup" />
}
