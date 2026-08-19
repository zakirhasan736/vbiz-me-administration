'use client'

import { useAccountStatus } from '@/hooks/useAccountStatus'
import { ACCOUNT_PAUSED_CREATE_MESSAGE } from '@/lib/accountStatus'
import { applyCardOrder, CORPORATE_CARD_ORDER_KEY, loadCardOrder, reorderByIndex, saveCardOrder } from '@/lib/cardOrder'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { corporateCardCreateBlockedReason } from '@/lib/corporateCardCapacity'
import { notify } from '@/lib/toast/toast'
import {
  mapApiProfileToVCardRecord,
  useDuplicateProfileMutation,
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

  const [duplicateProfile] = useDuplicateProfileMutation()
  const [updateProfileCard] = useUpdateProfileCardMutation()
  const { canMutateVcards } = useAccountStatus()

  const [cardOrder, setCardOrder] = useState<string[]>(() => loadCardOrder(CORPORATE_CARD_ORDER_KEY))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const capacity = profilesResult?.capacity
  const cards = useMemo(() => (profilesResult?.items ?? []).map(mapApiProfileToVCardRecord), [profilesResult?.items])

  const quotaLimit = capacity?.limit ?? null
  const quotaRemaining = capacity?.remaining ?? null
  const currentCount = capacity?.used ?? cards.length
  const quotaPercentage =
    quotaLimit != null && quotaLimit > 0 ? Math.min((currentCount / quotaLimit) * 100, 100) : currentCount > 0 ? 100 : 0
  const capacityAllowsCreate = capacity?.canCreate ?? false
  const canCreate = capacityAllowsCreate && canMutateVcards
  const createDisabledReason = corporateCardCreateBlockedReason({
    canMutateVcards,
    pausedMessage: ACCOUNT_PAUSED_CREATE_MESSAGE,
    limit: quotaLimit,
    used: currentCount,
    remaining: quotaRemaining,
  })
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
    async (card: VCardRecord): Promise<string | null> => {
      if (!canCreate) return null
      if (isOwnerCardLocked(card.status)) {
        notify.error(SUSPENDED_CARD_MESSAGE)
        return null
      }
      try {
        const created = await duplicateProfile(card.id).unwrap()
        void refetch()
        return created?.id ?? null
      } catch (e) {
        const message =
          (e as { data?: { message?: string } })?.data?.message || (e as Error)?.message || 'Could not duplicate card.'
        notify.error(message)
        return null
      }
    },
    [canCreate, duplicateProfile, refetch]
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
    quotaRemaining,
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
