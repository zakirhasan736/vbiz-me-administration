'use client'

import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { UsaDigitalCardFace } from '@/profile-app/components/UsaDigitalCardFace'
import { downloadAppleWalletPass } from '@/profile-app/lib/appleWallet'
import { openGoogleWalletInNewTab } from '@/profile-app/lib/googleWallet'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { resolveGlobalProfession } from '@/profile-app/lib/profileHomeData'
import { Loader2, Smartphone, Wallet, X } from 'lucide-react'
import { useState } from 'react'

type SaveToWalletModalProps = {
  isOpen: boolean
  onClose: () => void
  cardSlug?: string
  ownerName?: string
}

export function SaveToWalletModal({ isOpen, onClose, cardSlug, ownerName }: SaveToWalletModalProps) {
  const { design, personal, homeMedia, isVisible } = useProfileDisplay()
  const primaryColor = design?.primaryColor || design?.accentColor || '#0B1F3A'
  const secondaryColor = design?.accentColor || '#C9A24A'
  const [savingGoogle, setSavingGoogle] = useState(false)
  const [savingApple, setSavingApple] = useState(false)

  const holder = (personal.fullName || ownerName || 'Cardholder').trim()
  const logoUrl = homeMedia.profileMedia || ''

  const handleGoogleWallet = async () => {
    setSavingGoogle(true)
    try {
      await openGoogleWalletInNewTab(cardSlug)
    } finally {
      setSavingGoogle(false)
    }
  }

  const handleAppleWallet = async () => {
    setSavingApple(true)
    try {
      await downloadAppleWalletPass(cardSlug)
    } finally {
      setSavingApple(false)
    }
  }

  return (
    <ProfileModalShell isOpen={isOpen} onClose={onClose} panelClassName="sm:max-w-lg">
      <div className="relative z-10 p-6">
        <button
          type="button"
          onClick={onClose}
          className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close save to wallet dialog"
        >
          <X size={16} />
        </button>

        <div className="mb-4 pr-8">
          <h3 className="vbiz-title text-xl font-bold tracking-tight">Save to Wallet</h3>
          <p className="vbiz-description mt-2 text-sm leading-relaxed">
            Add {holder}&apos;s digital card to Apple Wallet or Google Wallet.
          </p>
        </div>

        <div className="mb-5">
          <UsaDigitalCardFace
            holderName={holder}
            designation={resolveGlobalProfession(personal, isVisible)}
            company={personal.company}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={logoUrl}
            cardSlug={cardSlug}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleGoogleWallet()}
            disabled={savingGoogle}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: secondaryColor, color: '#0f172a' }}
          >
            {savingGoogle ? (
              <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden />
            ) : (
              <Wallet size={18} className="shrink-0" aria-hidden />
            )}
            {savingGoogle ? 'Opening Google Wallet…' : 'Save to Google Wallet'}
          </button>

          <button
            type="button"
            onClick={() => void handleAppleWallet()}
            disabled={savingApple}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: secondaryColor, color: '#0f172a' }}
          >
            {savingApple ? (
              <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden />
            ) : (
              <Smartphone size={18} className="shrink-0" aria-hidden />
            )}
            {savingApple ? 'Opening Apple Wallet…' : 'Save to Apple Wallet'}
          </button>
        </div>
      </div>
    </ProfileModalShell>
  )
}
