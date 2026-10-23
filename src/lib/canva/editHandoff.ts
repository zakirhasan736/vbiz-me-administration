import type { CanvaEditSession } from '@/lib/canva/types'

const PENDING_KEY = 'vbiz_canva_edit_pending'
const READY_KEY = 'vbiz_canva_ready_import'
const APPLIED_PREFIX = 'vbiz_canva_applied_'

export type CanvaPendingHandoff = {
  sessionId: string
  designId: string
  profileId: string
  fieldKey: string
  itemKey?: string | null
  attachmentType?: string | null
  builderRoute: string
  mediaKind: 'image' | 'video'
  savedAt: number
}

/** Persisted after Canva return so Featured Media can fill even if the field mounts late. */
export type CanvaReadyImport = {
  sessionId: string
  designId: string
  designTitle?: string | null
  resultUrl: string
  resultFilename?: string | null
  profileId: string
  fieldKey: string
  itemKey?: string | null
  attachmentType?: string | null
  mediaKind: 'image' | 'video'
  savedAt: number
}

export function rememberCanvaHandoff(session: CanvaEditSession) {
  const payload: CanvaPendingHandoff = {
    sessionId: session.sessionId || session.id,
    designId: session.designId,
    profileId: session.profileId,
    fieldKey: session.fieldKey,
    itemKey: session.itemKey,
    attachmentType: session.attachmentType,
    builderRoute: session.builderRoute,
    mediaKind: session.mediaKind === 'video' ? 'video' : 'image',
    savedAt: Date.now(),
  }
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload))
    localStorage.setItem(
      `vbiz_canva_design_${payload.profileId}_${payload.fieldKey}_${payload.itemKey || 'root'}`,
      payload.designId
    )
  } catch {
    /* best-effort */
  }
}

export function readCanvaHandoff(): CanvaPendingHandoff | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CanvaPendingHandoff
  } catch {
    return null
  }
}

export function clearCanvaHandoff() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

export function readStoredCanvaDesignId(profileId: string, fieldKey: string, itemKey?: string | null) {
  try {
    return localStorage.getItem(`vbiz_canva_design_${profileId}_${fieldKey}_${itemKey || 'root'}`)
  } catch {
    return null
  }
}

export function markCanvaImportApplied(sessionId: string) {
  try {
    sessionStorage.setItem(`${APPLIED_PREFIX}${sessionId}`, '1')
  } catch {
    /* ignore */
  }
}

export function wasCanvaImportApplied(sessionId: string) {
  try {
    return sessionStorage.getItem(`${APPLIED_PREFIX}${sessionId}`) === '1'
  } catch {
    return false
  }
}

export function rememberCanvaReadyImport(session: CanvaEditSession) {
  if (!session.resultUrl) return
  const payload: CanvaReadyImport = {
    sessionId: session.sessionId || session.id,
    designId: session.designId,
    designTitle: session.designTitle,
    resultUrl: session.resultUrl,
    resultFilename: session.resultFilename,
    profileId: session.profileId,
    fieldKey: session.fieldKey,
    itemKey: session.itemKey,
    attachmentType: session.attachmentType,
    mediaKind: session.mediaKind === 'video' ? 'video' : 'image',
    savedAt: Date.now(),
  }
  try {
    localStorage.setItem(READY_KEY, JSON.stringify(payload))
  } catch {
    /* best-effort */
  }
}

export function peekCanvaReadyImport(): CanvaReadyImport | null {
  try {
    const raw = localStorage.getItem(READY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CanvaReadyImport
    if (!parsed?.sessionId || !parsed?.resultUrl || !parsed?.fieldKey) return null
    // Drop stale payloads (older than 2 hours).
    if (parsed.savedAt && Date.now() - parsed.savedAt > 2 * 60 * 60 * 1000) {
      localStorage.removeItem(READY_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearCanvaReadyImport() {
  try {
    localStorage.removeItem(READY_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Consume a ready import when the matching Featured Media field mounts.
 * Returns the payload once; clears storage so it is not applied twice.
 */
export function consumeCanvaReadyImport(match: {
  profileId: string
  fieldKey: string
  itemKey?: string | null
}): CanvaReadyImport | null {
  const pending = peekCanvaReadyImport()
  if (!pending) return null
  if (pending.profileId !== match.profileId) return null
  if (pending.fieldKey !== match.fieldKey) return null
  if ((pending.itemKey || '') !== (match.itemKey || '')) return null
  if (wasCanvaImportApplied(pending.sessionId)) {
    clearCanvaReadyImport()
    return null
  }
  markCanvaImportApplied(pending.sessionId)
  clearCanvaReadyImport()
  return pending
}

/** Build a path+query the Card Builder can restore after Canva return. */
export function currentBuilderRoute(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}
