'use client'

import { buildProfileIconPath, buildProfilePath } from '@/lib/profileRoutes'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { openCardInSafari, shareCurrentCard, usePwaInstall } from '@/profile-app/hooks/usePwaInstall'
import {
  Check,
  Cloud,
  Home,
  Loader2,
  Lock,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react'
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
  const { isInstalled, isIos, surface, installing, promptInstall } = usePwaInstall()
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
        setInstallMessage('Open this card in Safari (not Instagram/Facebook), then tap Share → Add to Home Screen.')
      }
      return
    }

    if (isIos || surface === 'mac-safari') {
      const shared = await shareCurrentCard(label)
      if (shared === 'cancelled') return
      if (shared === 'shared') {
        setInstallMessage(
          surface === 'mac-safari'
            ? 'In the share menu, choose Add to Dock.'
            : 'In the share sheet, tap Add to Home Screen, then Add.'
        )
        return
      }
      setInstallMessage(
        surface === 'mac-safari'
          ? 'On Mac Safari: File → Add to Dock, or Share → Add to Dock.'
          : surface === 'ios-chrome'
            ? 'On iPhone Chrome, tap Share or the menu, then Add to Home Screen. Safari is more reliable.'
            : 'Tap Share in Safari, then Add to Home Screen, then Add.'
      )
      return
    }
    const result = await promptInstall()
    if (result.ok) {
      setNativeAdded(true)
      setInstallMessage('Added. Open the new icon once so offline mode can finish.')
      return
    }
    if (result.reason === 'dismissed') {
      setInstallMessage('Install cancelled. You can try again or use the manual steps below.')
      return
    }
    setInstallMessage(
      surface === 'android'
        ? 'If Install did not open, use the browser menu → Add to Home screen / Install app (Chrome, Edge, or Samsung).'
        : surface === 'firefox'
          ? 'Firefox desktop cannot install this as an app. Use Chrome or Edge, or bookmark the card.'
          : 'Use the install icon in the address bar, or the browser menu → Install app.'
    )
  }

  return (
    <ProfileModalShell isOpen={isOpen} onClose={handleClose} panelClassName="sm:max-w-md">
      <div className="relative z-10 overflow-hidden p-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.24),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent)]" />
        <button
          type="button"
          onClick={handleClose}
          className="vbiz-modal-close absolute top-4 right-4 z-20 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close add to home screen dialog"
        >
          <X size={16} />
        </button>

        <div className="relative px-6 pt-7 pb-6">
          <div className="mb-5 flex items-center gap-4 pr-8">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={iconSrc}
                alt=""
                className="h-16 w-16 rounded-[22px] border border-white/20 object-cover shadow-xl shadow-black/15"
              />
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <Sparkles size={13} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="vbiz-pin mb-1 text-[10px] font-black tracking-wider uppercase">
                {contactJustSaved ? 'Contact saved ✓' : 'Smart PWA card'}
              </p>
              <h3 className="vbiz-title text-2xl leading-tight font-bold tracking-tight">
                {contactJustSaved ? 'Add this card to your Home Screen' : `Add ${label} to your Home Screen`}
              </h3>
              <p className="vbiz-description mt-1 text-sm leading-relaxed">
                {contactJustSaved
                  ? 'Contact saved ✓ — Add this card to your Home Screen for one-tap access.'
                  : 'Open it with one tap, keep it available offline, and receive the latest card updates.'}
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            <PwaBenefit icon={Home} label="Home icon" />
            <PwaBenefit icon={WifiOff} label="Offline card" />
            <PwaBenefit icon={Cloud} label="Auto sync" />
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <p className="text-xs font-bold">Offline readiness</p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black tracking-wide uppercase">
              {cacheChecking ? 'Checking' : offlineReady ? 'Ready' : 'Preparing'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="vbiz-btn mb-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98] disabled:opacity-60"
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

          <div className="vbiz-description space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-[12px] leading-relaxed">
            <p className="flex items-start gap-2 font-semibold">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
              How to add this card
            </p>
            {surface === 'ios-inapp' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Tap the browser menu and choose <strong>Open in Safari</strong> (or copy the link into Safari)
                </li>
                <li className="flex flex-wrap items-center gap-1">
                  In Safari, tap <Share className="inline h-3.5 w-3.5" /> <strong>Share</strong>
                </li>
                <li>
                  Tap <strong>Add to Home Screen</strong>, then Add
                </li>
              </ol>
            ) : surface === 'ios-safari' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li className="flex flex-wrap items-center gap-1">
                  Tap <Share className="inline h-3.5 w-3.5" /> <strong>Share</strong>
                </li>
                <li>
                  Scroll and tap <strong>Add to Home Screen</strong>, then Add
                </li>
                <li>Open the new Home Screen icon (not the Safari tab)</li>
              </ol>
            ) : surface === 'ios-chrome' || surface === 'ios-other' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Tap <strong>Share</strong> or the browser menu
                </li>
                <li>
                  Choose <strong>Add to Home Screen</strong>
                </li>
                <li>
                  For the most reliable icon, open this card in <strong>Safari</strong> and add it from there
                </li>
              </ol>
            ) : surface === 'android' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Tap <strong>Add to Home Screen</strong> above and accept Install (Chrome, Edge, Samsung)
                </li>
                <li>
                  Or open the browser menu → <strong>Add to Home screen</strong> / <strong>Install app</strong>
                </li>
                <li>Confirm, then open the new icon on your phone</li>
              </ol>
            ) : surface === 'mac-safari' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Mac Safari: <strong>File → Add to Dock</strong> (or Share → Add to Dock)
                </li>
                <li>Keep this card tab open while you add it</li>
                <li>Open the Dock icon once so offline mode can finish</li>
              </ol>
            ) : surface === 'firefox' ? (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Firefox desktop cannot install a Home Screen app for this card</li>
                <li>
                  Use <strong>Chrome</strong> or <strong>Edge</strong> and click Add to Home Screen / Install app
                </li>
                <li>Or bookmark this tab in Firefox</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  Click <strong>Add to Home Screen</strong> above, or the install icon in the address bar
                </li>
                <li>
                  Or use the browser menu → <strong>Install app</strong>
                </li>
                <li>Open the installed app once so offline mode can finish</li>
              </ol>
            )}
          </div>

          {installMessage ? (
            <p className="vbiz-description mt-3 text-center text-[12px] font-medium">{installMessage}</p>
          ) : null}

          <button
            type="button"
            onClick={handleClose}
            className="vbiz-btn mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98]"
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

function PwaBenefit({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
      <Icon className="mx-auto mb-1.5 h-4 w-4" />
      <p className="text-[10px] leading-tight font-bold uppercase">{label}</p>
    </div>
  )
}
