'use client'

import { buildProfileIconPath, buildProfilePath } from '@/lib/profileRoutes'
import type { PwaInstallSurface } from '@/lib/pwa/pwaInstallEnv'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { openCardInSafari, usePwaInstall } from '@/profile-app/hooks/usePwaInstall'
import { Check, Cloud, Home, Loader2, Lock, Smartphone, Sparkles, WifiOff, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

type SaveCardPwaModalProps = {
  isOpen: boolean
  onClose: () => void
  ownerName?: string
  avatarUrl?: string | null
  cardSlug?: string
  contactJustSaved?: boolean
}

export function SaveCardPwaModal({
  isOpen,
  onClose,
  ownerName,
  avatarUrl,
  cardSlug,
  contactJustSaved = false,
}: SaveCardPwaModalProps) {
  const { isInstalled, surface, installing, promptInstall } = usePwaInstall()
  const [installMessage, setInstallMessage] = useState<string | null>(null)
  const [nativeAdded, setNativeAdded] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [cacheChecking, setCacheChecking] = useState(false)
  const added = isInstalled || nativeAdded

  const label = ownerName?.trim() || 'this card'
  const iconSrc = cardSlug?.trim() ? buildProfileIconPath(cardSlug.trim(), 192) : avatarUrl || '/favicon.ico'

  useEffect(() => {
    if (!isOpen || !cardSlug?.trim() || typeof window === 'undefined' || !('caches' in window)) return
    const path = buildProfilePath(cardSlug.trim())
    let cancelled = false

    const checkOfflineReady = async () => {
      setCacheChecking(true)
      try {
        const cache = await caches.open('vbiz-public-card-shell-v2')
        const hit = (await cache.match(path)) || (await cache.match(window.location.origin + path))
        if (!cancelled) setOfflineReady(Boolean(hit))
      } catch {
        if (!cancelled) setOfflineReady(false)
      } finally {
        if (!cancelled) setCacheChecking(false)
      }
    }

    void checkOfflineReady()

    return () => {
      cancelled = true
    }
  }, [isOpen, cardSlug])

  const handleClose = () => {
    setInstallMessage(null)
    setNativeAdded(false)
    onClose()
  }

  const handleInstall = async () => {
    setInstallMessage(null)
    if (isInstalled || added) {
      setInstallMessage('This card is already on your Home Screen. Open it from the icon.')
      return
    }
    if (surface === 'ios-inapp') {
      if (!openCardInSafari()) {
        setInstallMessage('Open this card in Safari, then follow the steps below.')
      }
      return
    }

    const result = await promptInstall()
    if (result.ok) {
      setNativeAdded(true)
      setInstallMessage('Added. Open the new icon once so offline mode can finish.')
      return
    }
    if (result.reason === 'dismissed') {
      setInstallMessage('Install cancelled. You can try again or use the steps below.')
      return
    }
    setInstallMessage('The install alert did not open. Follow the steps below.')
  }

  return (
    <ProfileModalShell
      isOpen={isOpen}
      onClose={handleClose}
      panelClassName="min-h-0 !max-h-[calc(100svh-max(1rem,env(safe-area-inset-top,0px))-max(1.25rem,env(safe-area-inset-bottom,0px)))] sm:max-w-md"
      backdropClassName="vbiz-modal-backdrop fixed inset-0 z-100 flex items-center justify-center overflow-hidden px-[max(0.75rem,env(safe-area-inset-left,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md"
    >
      <div className="relative z-10 max-h-[calc(100svh-max(1rem,env(safe-area-inset-top,0px))-max(1.25rem,env(safe-area-inset-bottom,0px)))] overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.24),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent)]" />
        <div className="sticky top-0 z-20 flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="vbiz-modal-close rounded-full border p-1.5 transition-all focus:outline-none"
            aria-label="Close add to home screen dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative px-4 pt-1 pb-4">
          <div className="mb-2.5 flex flex-col items-center px-2 text-center">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc}
                alt=""
                className="h-12 w-12 rounded-2xl border border-white/20 object-cover shadow-lg shadow-black/15"
              />
              <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                <Sparkles size={11} />
              </span>
            </div>
            <p className="vbiz-title mt-2 max-w-full truncate text-sm font-bold">{label}</p>
            <h3 className="vbiz-title mt-1 text-base leading-tight font-bold tracking-tight">
              Add this card to your Home Screen
            </h3>
            <p className="vbiz-description mt-1 text-xs leading-snug">
              {isInstalled || added
                ? 'This card is already on your Home Screen. Open it from the icon.'
                : contactJustSaved
                  ? 'Contact saved. Add this card to your Home Screen to open it in one tap, even offline.'
                  : 'Open it in one tap, keep it offline, and get the latest updates.'}
            </p>
          </div>

          <div className="mb-2.5 grid grid-cols-3 gap-1.5">
            <PwaBenefit icon={Home} label="Home icon" />
            <PwaBenefit icon={WifiOff} label="Offline card" />
            <PwaBenefit icon={Cloud} label="Auto sync" />
          </div>

          <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <p className="text-[11px] font-bold">Offline readiness</p>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black tracking-wide uppercase">
              {cacheChecking ? 'Checking' : offlineReady ? 'Ready' : 'Preparing'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="vbiz-btn mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wide uppercase transition-all active:scale-[0.98] disabled:opacity-60"
            data-role="primary"
          >
            {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Home className="h-4 w-4" />}
            {isInstalled || added
              ? 'Already added'
              : surface === 'ios-inapp'
                ? 'Open in Safari'
                : surface === 'mac-safari'
                  ? 'Add to Dock'
                  : 'Add to Home Screen'}
          </button>

          <InstallSteps surface={surface} />

          {installMessage ? (
            <p className="vbiz-description mt-3 text-center text-[12px] font-medium">{installMessage}</p>
          ) : null}

          <button
            type="button"
            onClick={handleClose}
            className="vbiz-btn mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wide uppercase transition-all active:scale-[0.98]"
            data-role="secondary"
          >
            <Check className="h-4 w-4" />
            Complete
          </button>
        </div>
      </div>
    </ProfileModalShell>
  )
}

function installGuide(surface: PwaInstallSurface): { title: string; steps: string[] } {
  switch (surface) {
    case 'ios-inapp':
      return {
        title: 'Open Safari, then add it',
        steps: [
          'Open this card in Safari.',
          'Tap the Share button at the bottom.',
          'Tap Add to Home Screen, then Add.',
        ],
      }
    case 'ios-safari':
      return {
        title: 'On iPhone Safari',
        steps: ['Tap the Share button at the bottom.', 'Tap Add to Home Screen.', 'Tap Add, then open the new icon.'],
      }
    case 'ios-chrome':
    case 'ios-other':
      return {
        title: 'On this iPhone browser',
        steps: [
          'Tap Share, or the browser menu.',
          'Tap Add to Home Screen, then Add.',
          'Safari gives the most reliable icon.',
        ],
      }
    case 'android':
      return {
        title: 'On Android',
        steps: [
          'Tap Add to Home Screen above.',
          'In the browser alert, tap Install or Add.',
          'If no alert shows, open the browser menu and tap Install app.',
        ],
      }
    case 'mac-safari':
      return {
        title: 'On Mac Safari',
        steps: ['Keep this card tab open.', 'Choose File, then Add to Dock.', 'Open the new Dock icon once.'],
      }
    case 'firefox':
      return {
        title: 'Use Chrome or Edge',
        steps: [
          'Firefox cannot install this card.',
          'Open the card in Chrome or Edge.',
          'Tap Add to Home Screen, then Install.',
        ],
      }
    default:
      return {
        title: 'On this browser',
        steps: [
          'Tap Add to Home Screen above.',
          'Confirm Install in the browser alert.',
          'Or use the browser menu and choose Install app.',
        ],
      }
  }
}

function InstallSteps({ surface }: { surface: PwaInstallSurface }) {
  const guide = installGuide(surface)
  return (
    <div className="vbiz-description rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold">
        <Smartphone className="h-4 w-4 shrink-0" />
        {guide.title}
      </p>
      <ol className="space-y-2">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 text-[12px] leading-snug">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PwaBenefit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-1 py-1.5 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-0.5 h-3.5 w-3.5" />
      <p className="text-[9px] leading-tight font-bold tracking-wide uppercase">{label}</p>
    </div>
  )
}
