'use client'

import { AiCardAgentWizard } from '@/components/vcard/create-agent/AiCardAgentWizard'
import { getAiSeedCreateCardNavIds, normalizeNavOrderWithPinnedEnds } from '@/lib/createCardTabs'
import { notify } from '@/lib/toast/toast'
import { useVCard } from '@/lib/VCardContext'
import { applyEnabledNavOrderToDisplaySettings, getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import {
  buildEditorPath,
  buildEditorSettingsPath,
  DEFAULT_EDITOR_SECTION,
  type SettingsTabId,
} from '@/lib/vcardEditorRoutes'
import { storageKeyForEditorNavOrder } from '@/lib/vcardNavbar'
import { useRouter, useSearchParams } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type CreateAgentUiContextValue = {
  showAgent: boolean
  openAgent: () => void
  closeAgent: () => void
}

const CreateAgentUiContext = createContext<CreateAgentUiContextValue | null>(null)

export function useCreateAgentUi() {
  const ctx = useContext(CreateAgentUiContext)
  if (!ctx) {
    return {
      showAgent: false,
      openAgent: () => undefined,
      closeAgent: () => undefined,
    }
  }
  return ctx
}

function readDraftNavIds(): string[] {
  if (typeof window === 'undefined') return getAiSeedCreateCardNavIds()
  try {
    const raw = localStorage.getItem(storageKeyForEditorNavOrder('draft'))
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length) return normalizeNavOrderWithPinnedEnds(parsed)
    }
  } catch {
    /* ignore */
  }
  return getAiSeedCreateCardNavIds()
}

function persistDraftNavIds(ids: string[]) {
  const normalized = normalizeNavOrderWithPinnedEnds(ids)
  try {
    localStorage.setItem(storageKeyForEditorNavOrder('draft'), JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('vbiz-create-nav-order', { detail: normalized }))
  return normalized
}

function CreateAgentWizardHost({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { vCardData, updateData, saveVCard } = useVCard()
  const [enabledNavIds, setEnabledNavIds] = useState<string[]>(readDraftNavIds)

  useEffect(() => {
    const onNav = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      if (Array.isArray(detail) && detail.length) setEnabledNavIds(normalizeNavOrderWithPinnedEnds(detail))
    }
    window.addEventListener('vbiz-create-nav-order', onNav as EventListener)
    return () => window.removeEventListener('vbiz-create-nav-order', onNav as EventListener)
  }, [])

  return (
    <AiCardAgentWizard
      open={open}
      onClose={onClose}
      vCardData={vCardData}
      updateData={updateData}
      enabledNavIds={enabledNavIds}
      onEnableNavIds={(ids) => {
        const next = persistDraftNavIds(ids)
        setEnabledNavIds(next)
        const display = applyEnabledNavOrderToDisplaySettings(getDisplaySettingsFromVCard(vCardData), next)
        updateData('displaySettings', display)
      }}
      onOpenSettings={(section: SettingsTabId) => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        params.set('agent', '1')
        const qs = params.toString()
        router.push(`${buildEditorSettingsPath('/vcards/create', section)}${qs ? `?${qs}` : ''}`)
      }}
      onOpenLivePreview={() => {
        window.dispatchEvent(new CustomEvent('vbiz-open-live-preview'))
      }}
      onCreateCard={async (options) => {
        try {
          const publish = options?.publish === true
          const id = await saveVCard({ skipNavigate: true, publish })
          notify.success(publish ? 'vCard created and activated.' : 'vCard draft saved.')
          return id
        } catch (e) {
          const message =
            (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not create vCard.'
          notify.error(message)
          throw e instanceof Error ? e : new Error(message)
        }
      }}
      onCreatedNavigate={(newId) => {
        if (newId) {
          router.push(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, newId))
        }
      }}
    />
  )
}

export function CreateAgentUiProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isAgentQuery = searchParams.get('agent') === '1'
  const [manualAgentOpen, setManualAgentOpen] = useState(false)
  const showAgent = isAgentQuery || manualAgentOpen

  const openAgent = useCallback(() => {
    setManualAgentOpen(true)
    if (searchParams.get('agent') === '1') return
    const params = new URLSearchParams(searchParams.toString())
    params.set('agent', '1')
    // Only mint a reset token for a brand-new AI session (avoids remounting mid-flow)
    if (!params.get('reset')) params.set('reset', `${Date.now().toString(36)}`)
    const path = typeof window !== 'undefined' ? window.location.pathname : '/vcards/create/home'
    router.replace(`${path}?${params.toString()}`)
  }, [router, searchParams])

  const closeAgent = useCallback(() => {
    setManualAgentOpen(false)
    if (searchParams.get('agent') !== '1') return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('agent')
    params.delete('reset')
    const qs = params.toString()
    const path = typeof window !== 'undefined' ? window.location.pathname : '/vcards/create/home'
    router.replace(qs ? `${path}?${qs}` : path)
  }, [router, searchParams])

  const value = useMemo(
    () => ({
      showAgent,
      openAgent,
      closeAgent,
    }),
    [showAgent, openAgent, closeAgent]
  )

  return (
    <CreateAgentUiContext.Provider value={value}>
      {children}
      <CreateAgentWizardHost open={showAgent} onClose={closeAgent} />
    </CreateAgentUiContext.Provider>
  )
}
