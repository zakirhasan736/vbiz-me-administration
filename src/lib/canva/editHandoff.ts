import type { CanvaEditSession } from '@/lib/canva/types'

const PENDING_KEY = 'vbiz_canva_edit_pending'
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

/** Build a path+query the Card Builder can restore after Canva return. */
export function currentBuilderRoute(): string {
  if (typeof window === 'undefined') return '/'
  return `${window.location.pathname}${window.location.search}`
}
