'use client'

import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type LivePreviewContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  /** Section the editor is currently on — the preview follows it. */
  editorSectionId: string
  setEditorSectionId: (sectionId: string) => void
}

const LivePreviewContext = createContext<LivePreviewContextValue | null>(null)

/**
 * Owns live preview state above the editor route segments so opening the preview
 * survives section navigation (`/vcards/edit/home` -> `/vcards/edit/services`).
 */
export function LivePreviewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editorSectionId, setEditorSectionId] = useState(DEFAULT_PROFILE_SECTION)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const value = useMemo<LivePreviewContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      editorSectionId,
      setEditorSectionId,
    }),
    [isOpen, open, close, toggle, editorSectionId]
  )

  return <LivePreviewContext.Provider value={value}>{children}</LivePreviewContext.Provider>
}

export function useLivePreview(): LivePreviewContextValue {
  const ctx = useContext(LivePreviewContext)
  if (!ctx) {
    throw new Error('useLivePreview must be used within a LivePreviewProvider')
  }
  return ctx
}
