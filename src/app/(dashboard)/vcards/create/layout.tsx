'use client'

import { CardScopeProvider } from '@/lib/card-scope'
import { VCardProvider } from '@/lib/VCardContext'

/**
 * Keep create-mode draft state across editor tab URL changes.
 * Providers must live here — not in the page client — or segment
 * navigations remount VCardProvider and wipe personal.fullName / slug.
 */
export default function CreateVCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CardScopeProvider cardId={null} mode="create">
      <VCardProvider>{children}</VCardProvider>
    </CardScopeProvider>
  )
}
