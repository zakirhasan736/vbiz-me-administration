'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { Loader2, Palette, X } from 'lucide-react'
import { useState } from 'react'

type CanvaConnectModalProps = {
  isOpen: boolean
  onClose: () => void
  userId?: string | null
  returnTo?: string
  title?: string
  description?: string
  onConnected?: () => void
  onConnect?: () => void | Promise<void>
  error?: string | null
}

type CanvaConnectModalContentProps = Omit<CanvaConnectModalProps, 'isOpen'>

function CanvaConnectModalContent({
  onClose,
  userId,
  title = 'Canva Integration',
  description = 'Connect your Canva account to create custom profile images, wallpapers, and intro videos directly from your dashboard.',
  onConnect,
  error,
}: CanvaConnectModalContentProps) {
  const [step, setStep] = useState<'connect' | 'connecting'>('connect')

  const handleConnect = () => {
    if (!userId) return
    setStep('connecting')
    void onConnect?.()
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-200 flex items-center justify-center bg-slate-400/20 p-4 backdrop-blur-sm duration-200 dark:bg-black/60">
      <div className="animate-in zoom-in-95 relative w-full max-w-[400px] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl duration-300 dark:border-white/10 dark:bg-[#0b0f19]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-slate-200 p-2 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-[24px] bg-linear-to-tr from-[#00C4CC] to-[#7D2AE8] p-[2px] shadow-[0_0_30px_rgba(125,42,232,0.3)]">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-[#0b0f19]">
              <Palette className="h-10 w-10 text-[#00C4CC]" />
            </div>
          </div>

          <h3 className="mb-2 text-[22px] font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="mb-8 text-[14px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
            {step === 'connecting' ? 'Redirecting to Canva for secure authorization...' : description}
          </p>

          {error ? <p className="mb-4 text-[13px] font-medium text-red-500">{error}</p> : null}

          {step === 'connect' && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={!userId}
              className="w-full rounded-[16px] border border-slate-200 bg-white py-4 text-[15px] font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
            >
              {userId ? 'Connect Canva' : 'Sign in to connect Canva'}
            </button>
          )}

          {step === 'connecting' && (
            <div className="flex items-center justify-center py-4 text-[#00C4CC]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CanvaConnectModal({ isOpen, ...props }: CanvaConnectModalProps) {
  if (!isOpen) return null

  return (
    <ModalPortal>
      <CanvaConnectModalContent {...props} />
    </ModalPortal>
  )
}
