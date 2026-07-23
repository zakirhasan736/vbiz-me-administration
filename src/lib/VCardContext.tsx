'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useCardScopeId, useCardScopeMode } from '@/lib/card-scope'
import { designSettingsToVCardDefaults } from '@/lib/vcardDesignDefaults'
import { createDefaultVCardSocial } from '@/lib/vcardSocial'
import { addVCard, replaceVCardData, selectVCardById, updateVCard } from '@/redux/features/vcards/vcards.slice'
import type { RootState } from '@/redux/store'
import type { VCardData, VCardRecord } from '@/types/vcard'
import { createDefaultVCardData } from '@/types/vcard'
import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface VCardContextType {
  cardId: string | null
  isCreateMode: boolean
  vCardData: VCardData
  updateData: (path: string, value: unknown) => void
  /** Dashboard list avatar / preview thumbnail (Media & Profile tab). */
  updateMeta: (patch: { avatarImageUrl?: string }) => void
  saveVCard: () => Promise<void>
  loading: boolean
}

const VCardContext = createContext<VCardContextType | undefined>(undefined)

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.')
  const clone = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>
  let current: Record<string, unknown> = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {}
    }
    current = current[k] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
  return clone
}

function toVCardData(record: VCardRecord): VCardData {
  const rest = { ...record } as Record<string, unknown>
  delete rest.id
  delete rest.createdAt
  delete rest.updatedAt
  delete rest.views
  delete rest.saves
  delete rest.avatarImageUrl
  delete rest.isActive
  return rest as VCardData
}

function newCardId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function buildCreateDraft(design: RootState['designSettings']): VCardData {
  const defaults = designSettingsToVCardDefaults(design)
  return createDefaultVCardData({
    theme: defaults.theme,
    appearance: defaults.appearance,
  })
}

function designDefaultsSignature(design: RootState['designSettings']): string {
  const d = designSettingsToVCardDefaults(design)
  return JSON.stringify(d)
}

export function VCardProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const cardId = useCardScopeId()
  const mode = useCardScopeMode()
  const isCreateMode = mode === 'create'
  const design = useAppSelector((s) => s.designSettings)
  const record = useAppSelector((s: RootState) => selectVCardById(s, cardId))

  const accountDefaultsSig = designDefaultsSignature(design)

  const [createDraft, setCreateDraft] = useState<VCardData>(() => buildCreateDraft(design))
  const [appliedDefaultsSig, setAppliedDefaultsSig] = useState(accountDefaultsSig)

  if (isCreateMode && accountDefaultsSig !== appliedDefaultsSig) {
    setAppliedDefaultsSig(accountDefaultsSig)
    const defaults = designSettingsToVCardDefaults(design)
    setCreateDraft((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...defaults.theme },
      appearance: defaults.appearance,
    }))
  }

  const vCardData: VCardData = useMemo(() => {
    const base = isCreateMode ? createDraft : !record ? createDefaultVCardData() : toVCardData(record)
    return {
      ...base,
      social: base.social ?? createDefaultVCardSocial(),
      extraFields: base.extraFields ?? [],
      education: base.education ?? [],
      experience: base.experience ?? [],
      services: base.services ?? [],
      generalPosts: base.generalPosts ?? [],
      faqs: base.faqs ?? [],
    }
  }, [isCreateMode, createDraft, record])

  const updateData = useCallback(
    (path: string, value: unknown) => {
      if (isCreateMode) {
        setCreateDraft(
          (prev) => setByPath(prev as unknown as Record<string, unknown>, path, value) as unknown as VCardData
        )
        return
      }
      if (!cardId || !record) return
      const dataOnly = toVCardData(record)
      const next = setByPath(dataOnly as unknown as Record<string, unknown>, path, value) as unknown as VCardData
      dispatch(replaceVCardData({ id: cardId, data: next }))
    },
    [isCreateMode, cardId, dispatch, record]
  )

  const updateMeta = useCallback(
    (patch: { avatarImageUrl?: string }) => {
      if (isCreateMode) return
      if (!cardId) return
      dispatch(updateVCard({ id: cardId, patch }))
    },
    [isCreateMode, cardId, dispatch]
  )

  const saveVCard = useCallback(async () => {
    if (isCreateMode) {
      const slug = createDraft.slug.trim()
      const name = createDraft.personal.fullName.trim()
      if (!name) {
        throw new Error('Please enter your name before creating the vCard.')
      }
      if (!slug) {
        throw new Error('Please set a public URL slug before creating the vCard.')
      }
      const id = newCardId()
      const defaults = designSettingsToVCardDefaults(design)
      dispatch(
        addVCard({
          id,
          seed: {
            ...createDraft,
            slug,
            theme: { ...defaults.theme, ...createDraft.theme },
            appearance: createDraft.appearance ?? defaults.appearance,
          },
        })
      )
      router.push('/vcards')
      return
    }

    if (!cardId || !record) {
      throw new Error('No vCard selected')
    }
    dispatch(replaceVCardData({ id: cardId, data: toVCardData(record) }))
    alert('Profile saved locally. It will sync to the server when the API is connected.')
  }, [isCreateMode, createDraft, design, cardId, dispatch, record, router])

  const value = useMemo(
    () => ({
      cardId,
      isCreateMode,
      vCardData,
      updateData,
      updateMeta,
      saveVCard,
      loading: false,
    }),
    [cardId, isCreateMode, vCardData, updateData, updateMeta, saveVCard]
  )

  return <VCardContext.Provider value={value}>{children}</VCardContext.Provider>
}

export function useVCard() {
  const context = useContext(VCardContext)
  if (context === undefined) {
    throw new Error('useVCard must be used within a VCardProvider')
  }
  return context
}
