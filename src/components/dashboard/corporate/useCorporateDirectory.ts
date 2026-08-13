'use client'

import { applyCardOrder, CORPORATE_CARD_ORDER_KEY, loadCardOrder, reorderByIndex, saveCardOrder } from '@/lib/cardOrder'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { notify } from '@/lib/toast/toast'
import {
  mapApiProfileToVCardRecord,
  mapVCardDataToProfilePayload,
  useCreateProfileMutation,
  useGetProfilesQuery,
  useUpdateProfileCardMutation,
} from '@/redux/features/profiles/profiles.api'
import type { VCardRecord } from '@/types/vcard'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type CorporateSortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc'
export type CorporateStatusFilter = 'all' | 'active' | 'inactive' | 'paused' | 'suspended' | 'draft'

function sortToApi(sort: CorporateSortOption): {
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'viewCount'
  sortDir: 'asc' | 'desc'
} {
  if (sort === 'oldest') return { sortBy: 'createdAt', sortDir: 'asc' }
  if (sort === 'name-asc') return { sortBy: 'name', sortDir: 'asc' }
  if (sort === 'name-desc') return { sortBy: 'name', sortDir: 'desc' }
  return { sortBy: 'createdAt', sortDir: 'desc' }
}

export function useCorporateDirectory(filters: {
  searchTerm: string
  statusFilter: CorporateStatusFilter
  sort: CorporateSortOption
  lifecycleTab?: 'active' | 'draft'
}) {
  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchTerm)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.searchTerm), 300)
    return () => window.clearTimeout(timer)
  }, [filters.searchTerm])

  const { sortBy, sortDir } = sortToApi(filters.sort)
  const lifecycleTab = filters.lifecycleTab || 'active'

  const {
    data: profilesResult,
    isLoading,
    isError,
    refetch,
  } = useGetProfilesQuery({
    q: debouncedSearch.trim() || undefined,
    status: 'all',
    sortBy,
    sortDir,
    skip: 0,
    limit: 100,
  })

  const [createProfile] = useCreateProfileMutation()
  const [updateProfileCard] = useUpdateProfileCardMutation()

  const [cardOrder, setCardOrder] = useState<string[]>(() => loadCardOrder(CORPORATE_CARD_ORDER_KEY))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const profiles = profilesResult?.items ?? []
  const capacity = profilesResult?.capacity
  const cards = useMemo(() => profiles.map(mapApiProfileToVCardRecord), [profiles])

  const quotaLimit = capacity?.limit ?? 0
  const currentCount = capacity?.used ?? cards.length
  const quotaPercentage = quotaLimit > 0 ? Math.min((currentCount / quotaLimit) * 100, 100) : currentCount > 0 ? 100 : 0
  const canCreate = capacity?.canCreate ?? false
  const createDisabledReason =
    quotaLimit <= 0
      ? 'No active package with card capacity. Upgrade your package to create cards.'
      : `Maximum of ${quotaLimit} corporate cards reached`
  const activeCount = cards.filter((c) => !c.isDraft).length
  const draftCount = cards.filter((c) => c.isDraft).length
  const totalViews = cards.reduce((sum, c) => sum + (c.views || 0), 0)

  const orderedCards = useMemo(() => applyCardOrder(cards, cardOrder), [cards, cardOrder])

  const filteredCards = useMemo(() => {
    let list = orderedCards
    if (lifecycleTab === 'active') list = list.filter((c) => !c.isDraft)
    if (lifecycleTab === 'draft') list = list.filter((c) => c.isDraft)
    if (filters.statusFilter === 'active') list = list.filter((c) => c.status === 'active' || c.isActive)
    if (filters.statusFilter === 'inactive') list = list.filter((c) => c.status === 'inactive')
    if (filters.statusFilter === 'paused') list = list.filter((c) => c.status === 'paused')
    if (filters.statusFilter === 'suspended') list = list.filter((c) => c.status === 'suspended')
    return list
  }, [orderedCards, lifecycleTab, filters.statusFilter])

  const handleDragStart = (index: number) => setDraggedIndex(index)

  const handleDragDrop = (list: VCardRecord[], targetIndex: number) => {
    if (draggedIndex === null) return
    const next = reorderByIndex(list, draggedIndex, targetIndex)
    const ids = next.map((c) => c.id).filter(Boolean)
    setCardOrder(ids)
    saveCardOrder(CORPORATE_CARD_ORDER_KEY, ids)
    setDraggedIndex(null)
  }

  const duplicateCard = useCallback(
    async (card: VCardRecord) => {
      if (!canCreate) return false
      if (isOwnerCardLocked(card.status)) {
        notify.error(SUSPENDED_CARD_MESSAGE)
        return false
      }
      const suffix = Math.floor(1000 + Math.random() * 9000)
      const payload = mapVCardDataToProfilePayload(card)
      try {
        await createProfile({
          ...payload,
          name: `${payload.name || 'Card'} (Copy)`,
          slug: `${payload.slug || 'card'}-${suffix}`,
          isDraft: true,
          isPublic: false,
        }).unwrap()
        notify.success('Card duplicated as draft.')
        void refetch()
        return true
      } catch (e) {
        const message =
          (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not duplicate card.'
        notify.error(message)
        return false
      }
    },
    [canCreate, createProfile, refetch]
  )

  const bulkUpdateStatus = useCallback(
    async (ids: string[], active: boolean) => {
      try {
        await Promise.all(
          ids.map((id) =>
            updateProfileCard({
              id,
              body: active ? { isDraft: false, isPublic: true, status: 'active' } : { isDraft: true, isPublic: false },
            }).unwrap()
          )
        )
        notify.success(active ? 'Cards activated.' : 'Cards moved to draft.')
        void refetch()
      } catch (e) {
        const message =
          (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not update cards.'
        notify.error(message)
      }
    },
    [refetch, updateProfileCard]
  )

  return {
    cards,
    orderedCards,
    filteredCards,
    isLoading,
    isError,
    refetch,
    quotaLimit,
    currentCount,
    quotaPercentage,
    canCreate,
    createDisabledReason,
    activeCount,
    draftCount,
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
