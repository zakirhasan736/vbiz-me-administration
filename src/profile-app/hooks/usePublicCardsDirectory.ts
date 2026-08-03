'use client'

import { mapPublicCardToListItem, type PublicCardListItem } from '@/lib/api/publicCards/mapPublicCards'
import {
  buildPublicCardsSearchParams,
  deriveProfessionOptionsFromListItems,
  deriveProfessionOptionsFromPublicCards,
  EMPTY_PUBLIC_CARDS_FILTERS,
  filterPublicCardsByQuery,
  hasActivePublicCardsFilters,
  isPublicCardsSearchReady,
  normalizePublicCardsSearchQuery,
  PUBLIC_CARDS_CATALOG_PER_PAGE,
  PUBLIC_CARDS_INITIAL_PER_PAGE,
  PUBLIC_CARDS_MAX_PER_PAGE,
  PUBLIC_CARDS_SEARCH_MIN_CHARS,
  updatePublicCardsFilter,
  type PublicCardsFilterState,
} from '@/lib/publicCards/publicCardsSearch'
import { useEnrichPublicCardImages } from '@/profile-app/hooks/useEnrichPublicCardImages'
import { useGetPublicCardsQuery, useLazyGetPublicCardsQuery } from '@/redux/api'
import type { PublicCard, PublicCardsDropdowns } from '@interfaces/api/publicCards'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function resetPagination(setters: {
  setExtraCards: (value: PublicCardListItem[]) => void
  setLoadedThroughPage: (value: number) => void
  setHasLoadedAll: (value: boolean) => void
}) {
  setters.setExtraCards([])
  setters.setLoadedThroughPage(1)
  setters.setHasLoadedAll(false)
}

function dedupePublicCards(cards: PublicCardListItem[]): PublicCardListItem[] {
  const seen = new Set<number>()
  return cards.filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

function dedupeRawPublicCards(cards: PublicCard[]): PublicCard[] {
  const seen = new Set<number>()
  return cards.filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

function hasStructuralPublicCardsFilters(filters: PublicCardsFilterState): boolean {
  return filters.stateId != null || filters.cityId != null || filters.professionId != null
}

export function usePublicCardsDirectory() {
  const [draftFilters, setDraftFilters] = useState<PublicCardsFilterState>(EMPTY_PUBLIC_CARDS_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PublicCardsFilterState>(EMPTY_PUBLIC_CARDS_FILTERS)
  const [extraCards, setExtraCards] = useState<PublicCardListItem[]>([])
  const [loadedThroughPage, setLoadedThroughPage] = useState(1)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isPrefetchingAll, setIsPrefetchingAll] = useState(false)
  const [catalogSnapshot, setCatalogSnapshot] = useState<PublicCard[]>([])
  const prefetchTokenRef = useRef(0)

  const structuralFilters = useMemo<PublicCardsFilterState>(
    () => ({
      ...appliedFilters,
      service: '',
    }),
    [appliedFilters.cityId, appliedFilters.professionId, appliedFilters.stateId]
  )

  const queryParams = useMemo(
    () =>
      buildPublicCardsSearchParams(structuralFilters, 1, {
        perPage: hasStructuralPublicCardsFilters(appliedFilters)
          ? PUBLIC_CARDS_INITIAL_PER_PAGE
          : PUBLIC_CARDS_CATALOG_PER_PAGE,
      }),
    [appliedFilters, structuralFilters]
  )

  const { data, isLoading, isFetching, error } = useGetPublicCardsQuery(queryParams)
  const [fetchPublicCards] = useLazyGetPublicCardsQuery()

  useEffect(() => {
    if (!data?.cards?.length || hasStructuralPublicCardsFilters(appliedFilters)) return
    const next = dedupeRawPublicCards(data.cards)
    queueMicrotask(() => setCatalogSnapshot(next))
  }, [appliedFilters, data?.cards])

  const firstCards = useMemo(() => data?.cards.map(mapPublicCardToListItem) ?? [], [data?.cards])
  const loadedCards = useMemo(() => dedupePublicCards([...firstCards, ...extraCards]), [extraCards, firstCards])

  const dropdowns: PublicCardsDropdowns = useMemo(() => {
    const apiDropdowns = data?.dropdowns ?? {}
    const professionsFromCatalog = deriveProfessionOptionsFromPublicCards(catalogSnapshot)
    const professions =
      professionsFromCatalog.length > 0 ? professionsFromCatalog : deriveProfessionOptionsFromListItems(loadedCards)

    return {
      ...apiDropdowns,
      professions,
    }
  }, [catalogSnapshot, data?.dropdowns, loadedCards])

  const searchQuery = normalizePublicCardsSearchQuery(appliedFilters.service)
  const isSearchActive = isPublicCardsSearchReady(searchQuery)

  const filteredCards = useMemo(() => {
    if (!isSearchActive) return loadedCards
    return filterPublicCardsByQuery(loadedCards, searchQuery)
  }, [isSearchActive, loadedCards, searchQuery])

  const { displayCards: cards, isEnrichingImages } = useEnrichPublicCardImages(filteredCards)

  const serverTotal = data?.pagination.total ?? 0
  const isSinglePageResult = data != null && data.pagination.last_page <= 1
  const effectiveHasLoadedAll = hasLoadedAll || isSinglePageResult
  const hasMore = data ? !effectiveHasLoadedAll && loadedThroughPage < data.pagination.last_page : false
  const remainingCount = Math.max(serverTotal - loadedCards.length, 0)

  const setDraftFilter = useCallback(
    <K extends keyof PublicCardsFilterState>(key: K, value: PublicCardsFilterState[K]) => {
      setDraftFilters((prev) => updatePublicCardsFilter(prev, key, value))
    },
    []
  )

  const applyFilters = useCallback(() => {
    const trimmedService = normalizePublicCardsSearchQuery(draftFilters.service)
    const nextApplied = {
      ...draftFilters,
      service: trimmedService.length > 0 && trimmedService.length < PUBLIC_CARDS_SEARCH_MIN_CHARS ? '' : trimmedService,
    }
    setDraftFilters(nextApplied)
    setAppliedFilters(nextApplied)
    resetPagination({ setExtraCards, setLoadedThroughPage, setHasLoadedAll })
  }, [draftFilters])

  const updateAndApplyFilter = useCallback(
    <K extends keyof PublicCardsFilterState>(key: K, value: PublicCardsFilterState[K]) => {
      setDraftFilters((prev) => {
        const next = updatePublicCardsFilter(prev, key, value)
        const trimmedService = normalizePublicCardsSearchQuery(next.service)
        const applied = {
          ...next,
          service:
            key === 'service' && trimmedService.length > 0 && trimmedService.length < PUBLIC_CARDS_SEARCH_MIN_CHARS
              ? ''
              : trimmedService,
        }
        setAppliedFilters(applied)
        resetPagination({ setExtraCards, setLoadedThroughPage, setHasLoadedAll })
        return next
      })
    },
    []
  )

  const clearFilters = useCallback(() => {
    setDraftFilters(EMPTY_PUBLIC_CARDS_FILTERS)
    setAppliedFilters(EMPTY_PUBLIC_CARDS_FILTERS)
    resetPagination({ setExtraCards, setLoadedThroughPage, setHasLoadedAll })
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !data) return

    setIsLoadingMore(true)
    try {
      const nextPage = loadedThroughPage + 1
      const result = await fetchPublicCards(
        buildPublicCardsSearchParams(structuralFilters, nextPage, {
          perPage: PUBLIC_CARDS_INITIAL_PER_PAGE,
        })
      ).unwrap()

      setExtraCards((prev) => dedupePublicCards([...prev, ...result.cards.map(mapPublicCardToListItem)]))
      setLoadedThroughPage(nextPage)
      if (nextPage >= result.pagination.last_page) {
        setHasLoadedAll(true)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [fetchPublicCards, hasMore, isLoadingMore, loadedThroughPage, structuralFilters])

  const prefetchAllCards = useCallback(async () => {
    if (!data || effectiveHasLoadedAll || isPrefetchingAll) return

    const token = ++prefetchTokenRef.current
    setIsPrefetchingAll(true)

    // Text search is client-side — only structural filters go to the API.
    const serverFilters: PublicCardsFilterState = structuralFilters

    try {
      const { total, last_page: lastPage } = data.pagination

      if (lastPage <= 1) {
        if (token === prefetchTokenRef.current) setHasLoadedAll(true)
        return
      }

      if (total <= PUBLIC_CARDS_MAX_PER_PAGE) {
        const result = await fetchPublicCards(
          buildPublicCardsSearchParams(serverFilters, 1, {
            perPage: total,
          })
        ).unwrap()

        if (token !== prefetchTokenRef.current) return

        const mapped = result.cards.map(mapPublicCardToListItem)
        setExtraCards(mapped.slice(firstCards.length))
        setLoadedThroughPage(result.pagination.last_page)
        setHasLoadedAll(true)
        return
      }

      let page = loadedThroughPage + 1
      let accumulated = [...extraCards]

      while (page <= lastPage) {
        const result = await fetchPublicCards(
          buildPublicCardsSearchParams(serverFilters, page, {
            perPage: PUBLIC_CARDS_INITIAL_PER_PAGE,
          })
        ).unwrap()

        if (token !== prefetchTokenRef.current) return

        accumulated = dedupePublicCards([...accumulated, ...result.cards.map(mapPublicCardToListItem)])
        setExtraCards(accumulated)
        setLoadedThroughPage(page)

        if (page >= lastPage) {
          setHasLoadedAll(true)
          break
        }

        page += 1
      }
    } finally {
      if (token === prefetchTokenRef.current) {
        setIsPrefetchingAll(false)
      }
    }
  }, [
    data,
    extraCards,
    fetchPublicCards,
    firstCards.length,
    effectiveHasLoadedAll,
    isPrefetchingAll,
    loadedThroughPage,
    structuralFilters,
  ])

  useEffect(() => {
    if (!data || effectiveHasLoadedAll || isLoading) return
    if (isSearchActive || hasStructuralPublicCardsFilters(appliedFilters)) {
      queueMicrotask(() => {
        void prefetchAllCards()
      })
    }
  }, [
    appliedFilters.cityId,
    appliedFilters.professionId,
    appliedFilters.stateId,
    data,
    effectiveHasLoadedAll,
    isLoading,
    isSearchActive,
    prefetchAllCards,
  ])

  return {
    cards,
    loadedCards,
    dropdowns,
    draftFilters,
    appliedFilters,
    hasActiveFilters: hasActivePublicCardsFilters(appliedFilters),
    isLoading,
    isFetching,
    isLoadingMore,
    isPrefetchingAll,
    isEnrichingImages,
    isSearching: isFetching && !isLoading,
    isSearchActive,
    searchQuery,
    error,
    hasMore,
    hasLoadedAll: effectiveHasLoadedAll,
    loadedCount: loadedCards.length,
    remainingCount,
    total: isSearchActive ? cards.length : serverTotal,
    serverTotal,
    setDraftFilter,
    applyFilters,
    updateAndApplyFilter,
    clearFilters,
    loadMore,
    prefetchAllCards,
  }
}
