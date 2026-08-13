'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { usePwaInstall } from '@/profile-app/hooks/usePwaInstall'
import { Download, Home, Loader2, Share, Smartphone, X } from 'lucide-react'
import { useState } from 'react'

type SaveCardPwaModalProps = {
  isOpen: boolean
  onClose: () => void
  onDownloadContact: () => void
  ownerName?: string
  avatarUrl?: string | null
  cardSlug?: string
}

export function SaveCardPwaModal({
  isOpen,
  onClose,
  onDownloadContact,
  ownerName,
  avatarUrl,
  cardSlug,
}: SaveCardPwaModalProps) {
  const { canNativeInstall, isInstalled, isIos, installing, promptInstall } = usePwaInstall()
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [installMessage, setInstallMessage] = useState<string | null>(null)

  const label = ownerName?.trim() || 'this card'
  const iconSrc = cardSlug?.trim()
    ? `/api/pwa/icon/${encodeURIComponent(cardSlug.trim())}?size=192`
    : avatarUrl || '/favicon.ico'

  const handleInstall = async () => {
    setInstallMessage(null)
    if (isInstalled) {
      setInstallMessage('This card is already on your home screen.')
      return
    }
    if (canNativeInstall) {
      const result = await promptInstall()
      if (result.ok) {
        setInstallMessage('Added to your home screen.')
        return
      }
      if (result.reason === 'dismissed') {
        setInstallMessage('Install cancelled.')
        return
      }
    }
    if (isIos) {
      setShowIosHelp(true)
      return
    }
    setShowIosHelp(true)
    setInstallMessage('Use your browser menu: Install app or Add to Home Screen.')
  }

  return (
    <ProfileModalShell isOpen={isOpen} onClose={onClose} panelClassName="sm:max-w-sm">
      <div className="relative z-10 p-6">
        <button
          type="button"
          onClick={onClose}
          className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close save card dialog"
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
            <h3 className="vbiz-title text-xl font-bold tracking-tight">Save card</h3>
            <p className="vbiz-description mt-1 text-sm leading-relaxed">
              Keep {label} on your phone like an app — avatar on your home screen.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98] disabled:opacity-60"
            data-role="primary"
          >
            {installing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Home className="h-4 w-4" />}
            {isInstalled ? 'Already on home screen' : 'Add to Home Screen'}
          </button>

          <button
            type="button"
            onClick={onDownloadContact}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] font-bold tracking-wide uppercase transition-all active:scale-[0.98]"
            data-role="secondary"
          >
            <Download className="h-4 w-4" />
            Download contact
          </button>
        </div>

        {installMessage && (
          <p className="vbiz-description mt-3 text-center text-[12px] font-medium">{installMessage}</p>
        )}

        {showIosHelp && (
          <div className="vbiz-description mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-[12px] leading-relaxed">
            <p className="flex items-start gap-2 font-semibold">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
              Add to Home Screen
            </p>
            {isIos ? (
              <ol className="list-decimal space-y-1 pl-5">
                <li className="flex items-center gap-1.5">
                  Tap <Share className="inline h-3.5 w-3.5" /> Share in Safari
                </li>
                <li>
                  Scroll and tap <strong>Add to Home Screen</strong>
                </li>
                <li>Confirm — the icon uses this card&apos;s photo and name</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-1 pl-5">
                <li>Open the browser menu (⋮ or ⋯)</li>
                <li>
                  Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>
                </li>
                <li>Confirm — opens as a standalone card app</li>
              </ol>
            )}
          </div>
        )}
      </div>
    </ProfileModalShell>
  )
}
