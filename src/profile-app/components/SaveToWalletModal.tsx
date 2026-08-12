'use client'

import { notify } from '@/lib/toast/toast'
import { ProfileModalShell } from '@/profile-app/components/ProfileModalShell'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { Smartphone, Wallet, X } from 'lucide-react'

type SaveToWalletModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function SaveToWalletModal({ isOpen, onClose }: SaveToWalletModalProps) {
  const { design } = useProfileDisplay()
  const accentColor = design?.accentColor ?? '#eab308'

  const handleComingSoon = () => {
    notify.info('Coming soon')
    onClose()
  }

  return (
    <ProfileModalShell isOpen={isOpen} onClose={onClose} panelClassName="sm:max-w-sm">
      <div className="relative z-10 p-6">
        <button
          type="button"
          onClick={onClose}
          className="vbiz-modal-close absolute top-4 right-4 rounded-full border p-1.5 transition-all focus:outline-none"
          aria-label="Close save to wallet dialog"
        >
          <X size={16} />
        </button>

        <div className="mb-5 pr-8">
          <h3 className="vbiz-title text-xl font-bold tracking-tight">Save to Wallet</h3>
          <p className="vbiz-description mt-2 text-sm leading-relaxed">
            Choose where you want to save this digital business card.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleComingSoon}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: accentColor,
              color: '#0f172a',
            }}
          >
            <Wallet size={18} className="shrink-0" aria-hidden />
            Save to Google Wallet
          </button>

          <button
            type="button"
            onClick={handleComingSoon}
            className="vbiz-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: accentColor,
              color: '#0f172a',
            }}
          >
            <Smartphone size={18} className="shrink-0" aria-hidden />
            Save to Apple Wallet
          </button>
        </div>
      </div>
    </ProfileModalShell>
  )
}
