'use client'

import { useVCard } from '@/lib/VCardContext'
import { isCorporateMemberEditorCard } from '@/lib/corporateCardDuplicate'
import {
  isHideOwnerSectionEnabled,
  mergeHiddenCorporateOwned,
  withHideOwnerSection,
  withoutCorporateOwned,
  type HideOwnerSectionsMap,
} from '@/lib/memberMediaVisibility'
import { useCallback, useMemo } from 'react'

/**
 * Corporate team member cards: optionally hide owner-synced list rows in the editor
 * while keeping them in saved state, and expose the "Only show my items" toggle state.
 */
export function useHideOwnerSectionList<T extends { corporateOwned?: boolean }>(
  sectionKey: string,
  items: T[],
  setItems: (next: T[]) => void
) {
  const { vCardData, updateData } = useVCard()
  const memberCard = isCorporateMemberEditorCard(vCardData)
  const hideOwner = memberCard && isHideOwnerSectionEnabled(vCardData.hideOwnerSections, sectionKey)
  const hasOwnerItems = memberCard && items.some((item) => item.corporateOwned)
  const visibleItems = useMemo(() => withoutCorporateOwned(items, hideOwner), [items, hideOwner])

  const commitVisible = useCallback(
    (nextVisible: T[]) => {
      setItems(hideOwner ? mergeHiddenCorporateOwned(items, nextVisible) : nextVisible)
    },
    [hideOwner, items, setItems]
  )

  const setHideOwner = useCallback(
    (next: boolean) => {
      const map: HideOwnerSectionsMap = withHideOwnerSection(vCardData.hideOwnerSections, sectionKey, next)
      updateData('hideOwnerSections', map)
    },
    [sectionKey, updateData, vCardData.hideOwnerSections]
  )

  return {
    memberCard,
    hideOwner,
    hasOwnerItems,
    visibleItems,
    commitVisible,
    setHideOwner,
  }
}
