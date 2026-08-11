'use client'

import { CreateAgentUiProvider } from '@/components/vcard/create-agent/CreateAgentUiProvider'
import { CardScopeProvider } from '@/lib/card-scope'
import { VCardProvider } from '@/lib/VCardContext'
import { storageKeyForEditorNavOrder } from '@/lib/vcardNavbar'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, type ReactNode } from 'react'

function CreateVCardProviders({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const resetKey = searchParams.get('reset') || 'default'

  // Clear draft nav only when a new create session starts (reset token changes)
  useEffect(() => {
    if (!resetKey || resetKey === 'default') return
    try {
      localStorage.removeItem(storageKeyForEditorNavOrder('draft'))
    } catch {
      /* ignore */
    }
  }, [resetKey])

  return (
    <CardScopeProvider cardId={null} mode="create">
      <VCardProvider key={resetKey}>
        {/* Wizard host stays mounted across /create section URL changes */}
        <CreateAgentUiProvider>{children}</CreateAgentUiProvider>
      </VCardProvider>
    </CardScopeProvider>
  )
}

export default function CreateVCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
          Loading editor…
        </div>
      }
    >
      <CreateVCardProviders>{children}</CreateVCardProviders>
    </Suspense>
  )
}
