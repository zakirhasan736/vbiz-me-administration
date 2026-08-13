'use client'

import { useEffect, useRef, useState } from 'react'

type Identifiable = { id: string }

export function useExpandableEntryList<T extends Identifiable>(items: T[]) {
  const [expandedId, setExpandedId] = useState<string>(() => items[items.length - 1]?.id ?? '')
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const pendingScrollId = useRef<string | null>(null)
  const pendingExpandId = useRef<string | null>(null)
  const itemsRef = useRef(items)
  // Stable membership key — normalize*() returns a new array each render.
  const itemsIdsKey = items.map((item) => item.id).join('\0')

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    const currentItems = itemsRef.current
    if (!currentItems.length) return

    const pending = pendingExpandId.current
    if (pending) {
      if (currentItems.some((item) => item.id === pending)) {
        pendingExpandId.current = null
        setExpandedId(pending)
      }
      // Wait for the new item to land — do not recover to last while pending.
      return
    }

    // Allow intentional collapse (empty id); only recover when the open card was removed.
    if (expandedId === '') return
    if (currentItems.some((item) => item.id === expandedId)) return
    setExpandedId(currentItems[currentItems.length - 1]!.id)
  }, [itemsIdsKey, expandedId])

  useEffect(() => {
    const id = pendingScrollId.current
    if (!id) return
    if (!itemsRef.current.some((item) => item.id === id)) return
    pendingScrollId.current = null
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [itemsIdsKey])

  const setCardRef = (id: string, el: HTMLElement | null) => {
    cardRefs.current[id] = el
  }

  const toggleExpanded = (id: string) => {
    pendingExpandId.current = null
    setExpandedId((current) => {
      if (current === id) {
        if (items.length <= 1) return current
        return ''
      }
      return id
    })
  }

  const expandNew = (id: string) => {
    pendingExpandId.current = id
    pendingScrollId.current = id
    if (items.some((item) => item.id === id)) {
      pendingExpandId.current = null
      setExpandedId(id)
    }
  }

  const recoverExpandedAfterRemove = (removedId: string, nextItems: T[]) => {
    if (expandedId !== removedId && pendingExpandId.current !== removedId) return
    pendingExpandId.current = null
    setExpandedId(nextItems[nextItems.length - 1]?.id ?? '')
  }

  const isExpanded = (id: string) => expandedId === id

  return {
    expandedId,
    setExpandedId,
    isExpanded,
    toggleExpanded,
    expandNew,
    recoverExpandedAfterRemove,
    setCardRef,
  }
}
