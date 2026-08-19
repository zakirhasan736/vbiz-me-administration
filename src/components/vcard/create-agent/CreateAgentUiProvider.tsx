'use client'

import { AiCardAgentWizard } from '@/components/vcard/create-agent/AiCardAgentWizard'
import { useCardScopeId, useCardScopeMode } from '@/lib/card-scope'
import { getAiSeedCreateCardNavIds, normalizeNavOrderWithPinnedEnds } from '@/lib/createCardTabs'
import { setAiCardAgentOpen } from '@/lib/dashboardTour'
import { notify } from '@/lib/toast/toast'
import { useVCard } from '@/lib/VCardContext'
import { applyEnabledNavOrderToDisplaySettings, getDisplaySettingsFromVCard } from '@/lib/vcardDisplaySettings'
import {
  buildEditorPath,
  buildEditorSettingsPath,
  DEFAULT_EDITOR_SECTION,
  type EditorBasePath,
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

function readStoredNavIds(cardKey: string, fallback: string[]): string[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(storageKeyForEditorNavOrder(cardKey))
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length) return normalizeNavOrderWithPinnedEnds(parsed)
    }
  } catch {
    /* ignore */
  }
  return fallback
}

function persistNavIds(cardKey: string, ids: string[]) {
  const normalized = normalizeNavOrderWithPinnedEnds(ids)
  try {
    localStorage.setItem(storageKeyForEditorNavOrder(cardKey), JSON.stringify(normalized))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('vbiz-create-nav-order', { detail: normalized }))
  return normalized
}

function CreateAgentWizardHost({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const mode = useCardScopeMode()
  const cardId = useCardScopeId()
  const { vCardData, updateData, saveVCard, flushSave, loading } = useVCard()
  const isEdit = mode === 'edit'
  const basePath: EditorBasePath = isEdit ? '/vcards/edit' : '/vcards/create'
  const cardKey = cardId || 'draft'
  const enabledNavIds = useMemo(() => {
    const fromCard = vCardData.displaySettings?.editorNavOrder
    if (Array.isArray(fromCard) && fromCard.length) return normalizeNavOrderWithPinnedEnds(fromCard)
    return readStoredNavIds(cardKey, isEdit ? [] : getAiSeedCreateCardNavIds())
  }, [cardKey, isEdit, vCardData.displaySettings?.editorNavOrder])

  return (
    <AiCardAgentWizard
      open={open}
      onClose={onClose}
      mode={isEdit ? 'edit' : 'create'}
      profileId={isEdit ? cardId || undefined : undefined}
      cardLoading={Boolean(isEdit && loading)}
      vCardData={vCardData}
      updateData={updateData}
      enabledNavIds={enabledNavIds}
      onEnableNavIds={(ids) => {
        const next = persistNavIds(cardKey, ids)
        const display = applyEnabledNavOrderToDisplaySettings(getDisplaySettingsFromVCard(vCardData), next)
        updateData('displaySettings', display)
      }}
      onOpenSettings={(section: SettingsTabId) => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
        params.set('agent', '1')
        if (cardId && !params.get('cardId')) params.set('cardId', cardId)
        const qs = params.toString()
        const path = buildEditorSettingsPath(basePath, section, isEdit ? cardId : null)
        const [pathname] = path.split('?')
        router.push(`${pathname}${qs ? `?${qs}` : ''}`)
      }}
      onOpenLivePreview={() => {
        window.dispatchEvent(new CustomEvent('vbiz-open-live-preview'))
      }}
      onCreateCard={async (options) => {
        try {
          if (isEdit) {
            await flushSave()
            return cardId || undefined
          }
          const publish = options?.publish === true
          const id = await saveVCard({ skipNavigate: true, publish })
          notify.success(
            publish
              ? 'vCard created and activated. Use View to open your card.'
              : 'Draft saved. Use Preview to review it, then Activate card when ready.'
          )
          return id
        } catch (e) {
          const message =
            (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not save vCard.'
          notify.error(message)
          throw e instanceof Error ? e : new Error(message)
        }
      }}
      onCreatedNavigate={(newId) => {
        if (isEdit) return
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

  useEffect(() => {
    setAiCardAgentOpen(showAgent)
    return () => setAiCardAgentOpen(false)
  }, [showAgent])

  const openAgent = useCallback(() => {
    setAiCardAgentOpen(true)
    setManualAgentOpen(true)
    if (searchParams.get('agent') === '1') return
    const params = new URLSearchParams(searchParams.toString())
    params.set('agent', '1')
    const path = typeof window !== 'undefined' ? window.location.pathname : '/vcards/create/home'
    router.replace(`${path}?${params.toString()}`)
  }, [router, searchParams])

  const closeAgent = useCallback(() => {
    setAiCardAgentOpen(false)
    setManualAgentOpen(false)
    if (searchParams.get('agent') !== '1') return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('agent')
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
