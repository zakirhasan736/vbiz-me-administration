'use client'

import { CanvaConnectModal } from '@/components/canva/CanvaConnectModal'
import { useCanvaConnection } from '@/components/canva/useCanvaConnection'
import { cn } from '@/utils/cn'
import { ChevronRight, Loader2, Palette } from 'lucide-react'
import { useState } from 'react'

type CanvaConnectRowProps = {
  userId?: string | null
  returnTo?: string
  variant?: 'status' | 'icon'
  title?: string
  description?: string
  className?: string
  onConnected?: () => void
  onDisconnected?: () => void
}

export function CanvaConnectRow({
  userId,
  returnTo,
  variant = 'status',
  title = 'Canva',
  description,
  className,
  onConnected,
  onDisconnected,
}: CanvaConnectRowProps) {
  const [showModal, setShowModal] = useState(false)
  const { isConnected, isLoading, error, connect, disconnect } = useCanvaConnection({
    userId,
    returnTo,
    enabled: Boolean(userId),
  })

  const handleConnectClick = () => {
    if (!userId) {
      setShowModal(true)
      return
    }
    setShowModal(true)
  }

  const handleDisconnect = async () => {
    await disconnect()
    onDisconnected?.()
  }

  if (variant === 'icon') {
    return (
      <>
        <div
          className={cn(
            'group flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-4 font-medium shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:bg-[#0b0f19]',
            className
          )}
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-12 w-12 items-center justify-center rounded-[16px] border shadow-sm transition-transform group-hover:scale-105">
              <Palette className="text-primary-600 dark:text-primary-400 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{title}</span>
              {description ? (
                <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">{description}</p>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : isConnected ? (
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="group/btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-bold text-emerald-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 active:scale-95 sm:w-auto sm:justify-start dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-colors group-hover/btn:bg-red-500 dark:bg-emerald-400" />
              <span className="group-hover/btn:hidden">Connected</span>
              <span className="hidden group-hover/btn:inline">Disconnect</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectClick}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] active:scale-95 sm:w-auto dark:bg-white dark:text-slate-900"
            >
              Connect <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <CanvaConnectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId={userId}
          returnTo={returnTo}
          onConnected={onConnected}
          onConnect={connect}
          error={error}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#070a13]',
          className
        )}
      >
        <div className="flex flex-col">
          <span className="text-[.875rem] font-semibold text-slate-900 dark:text-white">{title}</span>
          <span className="text-[.75rem] text-slate-500">
            Status: {isLoading ? 'Checking...' : isConnected ? 'Connected' : 'Not connected'}
          </span>
          {error ? <span className="mt-1 text-[.7rem] text-red-500">{error}</span> : null}
        </div>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
        ) : (
          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                void handleDisconnect()
              } else {
                handleConnectClick()
              }
            }}
            className={cn(
              'min-w-25 rounded-full px-4 py-2 text-[.8125rem] font-semibold transition-colors',
              isConnected
                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
            )}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        )}
      </div>

      <CanvaConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
        returnTo={returnTo}
        onConnected={onConnected}
        onConnect={connect}
        error={error}
      />
    </>
  )
}
