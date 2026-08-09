'use client'

import { CORPORATE_CARD_ORDER_KEY, applyCardOrder, loadCardOrder, reorderByIndex, saveCardOrder } from '@/lib/cardOrder'
import { getCorporateCardQuota } from '@/lib/corporateQuota'
import {
  mapApiProfileToVCardRecord,
  mapVCardDataToProfilePayload,
  useCreateProfileMutation,
  useGetProfilesQuery,
  useUpdateProfileCardMutation,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { filterVCardsByQuery } from '@/utils/vcard'
import { useCallback, useMemo, useState } from 'react'

export type CorporateSortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
export type CorporateStatusFilter = 'all' | 'active' | 'inactive' | 'suspended'

export function useCorporateDirectory() {
  const { data: profiles = [], isLoading, isError, refetch } = useGetProfilesQuery()
  const [createProfile] = useCreateProfileMutation()
  const [updateProfileCard] = useUpdateProfileCardMutation()

  const [cardOrder, setCardOrder] = useState<string[]>(() => loadCardOrder(CORPORATE_CARD_ORDER_KEY))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const cards = useMemo(() => profiles.map(mapApiProfileToVCardRecord), [profiles])
  const quotaLimit = getCorporateCardQuota()
  const currentCount = cards.length
  const quotaPercentage = Math.min((currentCount / quotaLimit) * 100, 100)
  const canCreate = currentCount < quotaLimit
  const createDisabledReason = `Maximum of ${quotaLimit} corporate cards reached`
  const activeCount = cards.filter((c) => c.isActive).length
  const totalViews = cards.reduce((sum, c) => sum + (c.views || 0), 0)

  const orderedCards = useMemo(() => applyCardOrder(cards, cardOrder), [cards, cardOrder])

  const filterAndSort = useCallback(
    (query: string, status: CorporateStatusFilter, sort: CorporateSortOption) => {
      let list = filterVCardsByQuery(orderedCards, query)
      if (status === 'active') list = list.filter((c) => c.isActive)
      if (status === 'inactive') list = list.filter((c) => !c.isActive)
      if (status === 'suspended') list = list.filter((c) => !c.isActive)

      if (cardOrder.length > 0 && sort === 'newest') return list

      const sorted = [...list]
      if (sort === 'name-asc') {
        sorted.sort((a, b) =>
          (a.personal.fullName || '').localeCompare(b.personal.fullName || '', undefined, { sensitivity: 'base' })
        )
      } else if (sort === 'name-desc') {
        sorted.sort((a, b) =>
          (b.personal.fullName || '').localeCompare(a.personal.fullName || '', undefined, { sensitivity: 'base' })
        )
      } else if (sort === 'oldest') {
        sorted.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      } else {
        sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      }
      return sorted
    },
    [orderedCards, cardOrder.length]
  )

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDragDrop = (filteredCards: VCardRecord[], targetIndex: number) => {
    if (draggedIndex === null) return
    const next = reorderByIndex(filteredCards, draggedIndex, targetIndex)
    const ids = next.map((c) => c.id).filter(Boolean)
    setCardOrder(ids)
    saveCardOrder(CORPORATE_CARD_ORDER_KEY, ids)
    setDraggedIndex(null)
  }

  const duplicateCard = async (card: VCardRecord) => {
    if (!canCreate) return false
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const payload = mapVCardDataToProfilePayload(card)
    try {
      await createProfile({
        ...payload,
        name: `${payload.name || 'Card'} (Copy)`,
        slug: `${payload.slug || 'card'}-${suffix}`,
      }).unwrap()
      void refetch()
      return true
    } catch {
      return false
    }
  }

  const bulkUpdateStatus = async (ids: string[], active: boolean) => {
    await Promise.all(ids.map((id) => updateProfileCard({ id, body: { status: active ? '1' : '0' } }).unwrap()))
    void refetch()
  }

  return {
    cards,
    orderedCards,
    filteredCards: filterAndSort,
    isLoading,
    isError,
    refetch,
    quotaLimit,
    currentCount,
    quotaPercentage,
    canCreate,
    createDisabledReason,
    activeCount,
    totalViews,
    cardOrder,
    draggedIndex,
    handleDragStart,
    handleDragDrop,
    setDraggedIndex,
    duplicateCard,
    bulkUpdateStatus,
  }
}
