'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { usePwaInstall } from '@/profile-app/hooks/usePwaInstall'
import { Check, Home, Loader2, Share, Smartphone, X } from 'lucide-react'
import { useState } from 'react'

type SaveCardPwaModalProps = {
  isOpen: boolean
  onClose: () => void
  ownerName?: string
  avatarUrl?: string | null
  cardSlug?: string
}

export function SaveCardPwaModal({ isOpen, onClose, ownerName, avatarUrl, cardSlug }: SaveCardPwaModalProps) {
  const { canNativeInstall, isInstalled, isIos, installing, promptInstall } = usePwaInstall()
  const [installMessage, setInstallMessage] = useState<string | null>(null)
  const [nativeAdded, setNativeAdded] = useState(false)
  const added = isInstalled || nativeAdded

  const label = ownerName?.trim() || 'this card'
  const iconSrc = cardSlug?.trim()
    ? `/api/pwa/icon/${encodeURIComponent(cardSlug.trim())}?size=192`
    : avatarUrl || '/favicon.ico'

  const handleClose = () => {
    setInstallMessage(null)
    setNativeAdded(false)
    onClose()
  }

  const handleInstall = async () => {
    setInstallMessage(null)
    if (isInstalled || added) {
      setInstallMessage('This card is already on your home screen.')
      return
    }
    if (canNativeInstall) {
      const result = await promptInstall()
      if (result.ok) {
        setNativeAdded(true)
        setInstallMessage('Added to your home screen.')
        return
      }
      if (result.reason === 'dismissed') {
        setInstallMessage('Install cancelled — you can try again or follow the steps below.')
        return
      }
    }
    setInstallMessage(
      isIos
        ? 'Safari cannot auto-add apps. Follow the steps below, then tap Complete.'
        : 'Follow the steps below, then tap Complete.'
    )
  }

  return (
    <ProfileModalShell isOpen={isOpen} onClose={handleClose} panelClassName="sm:max-w-sm">
      <div className="relative z-10 p-6">
        <button
          type="button"
          onClick={handleClose}
          className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close add to home screen dialog"
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-3 pr-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={iconSrc}
            alt=""
            className="h-14 w-14 rounded-[18px] border border-white/20 object-cover shadow-sm"
          />
          <div className="min-w-0">
            <h3 className="vbiz-title text-xl font-bold tracking-tight">Add to Home Screen</h3>
            <p className="vbiz-description mt-1 text-sm leading-relaxed">
              Pin {label} on your phone — tap the icon anytime to open this card.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleInstall()}
          disabled={installing}
          className="vbiz-btn mb-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98] disabled:opacity-60"
          data-role="primary"
        >
          {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Home className="h-4 w-4" />}
          {isInstalled || added ? 'Already on home screen' : 'Add to Home Screen'}
        </button>

        <div className="vbiz-description space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] leading-relaxed">
          <p className="flex items-start gap-2 font-semibold">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
            How to add this card
          </p>
          {isIos ? (
            <ol className="list-decimal space-y-1.5 pl-5">
              <li className="flex flex-wrap items-center gap-1">
                Tap <Share className="inline h-3.5 w-3.5" /> <strong>Share</strong> in Safari
              </li>
              <li>
                Scroll and tap <strong>Add to Home Screen</strong>
              </li>
              <li>Confirm — the icon uses this card&apos;s photo and name</li>
              <li>
                Come back here and tap <strong>Complete</strong>
              </li>
            </ol>
          ) : (
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                Tap <strong>Add to Home Screen</strong> above if the install sheet appears
              </li>
              <li>
                Or open the browser menu (⋮ or ⋯) and tap <strong>Install app</strong> /{' '}
                <strong>Add to Home Screen</strong>
              </li>
              <li>Confirm — this card opens like an app</li>
              <li>
                Then tap <strong>Complete</strong>
              </li>
            </ol>
          )}
        </div>

        {installMessage ? (
          <p className="vbiz-description mt-3 text-center text-[12px] font-medium">{installMessage}</p>
        ) : null}

        <button
          type="button"
          onClick={handleClose}
          className="vbiz-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98]"
          data-role="secondary"
        >
          <Check className="h-4 w-4" />
          Complete
        </button>
      </div>
    </ProfileModalShell>
  )
}
