import type { NoticeType } from '@/components/dashboard/vcard/NoticeModal'
import type { TeamNotice } from '@/redux/features/profiles/profiles.api'

export function cardNoticeStorageKey(cardId: string) {
  return `notice_${cardId}`
}

export function cardNoticeTypeStorageKey(cardId: string) {
  return `notice_type_${cardId}`
}

export function readLocalCardNotice(cardId: string): { text: string; type: NoticeType } {
  if (typeof window === 'undefined' || !cardId) return { text: '', type: 'info' }
  const text = localStorage.getItem(cardNoticeStorageKey(cardId)) || ''
  const raw = localStorage.getItem(cardNoticeTypeStorageKey(cardId)) || 'info'
  const type = (['info', 'warning', 'success'].includes(raw) ? raw : 'info') as NoticeType
  return { text, type }
}

export function writeLocalCardNotice(cardId: string, text: string, type: NoticeType) {
  if (typeof window === 'undefined' || !cardId) return
  if (text.trim()) {
    localStorage.setItem(cardNoticeStorageKey(cardId), text.trim())
    localStorage.setItem(cardNoticeTypeStorageKey(cardId), type)
  } else {
    clearLocalCardNotice(cardId)
  }
}

export function clearLocalCardNotice(cardId: string) {
  if (typeof window === 'undefined' || !cardId) return
  localStorage.removeItem(cardNoticeStorageKey(cardId))
  localStorage.removeItem(cardNoticeTypeStorageKey(cardId))
}

/** Latest active per-card notice (public banner or backoffice-only). */
export function noticeForCard(cardId: string, notices: TeamNotice[] | undefined): TeamNotice | null {
  if (!cardId || !notices?.length) return null
  const matches = notices.filter((n) => n.targetCardId === cardId && (n.status || 'active') === 'active')
  if (!matches.length) return null
  // Prefer public `all` banners when both exist; otherwise any active notice for the card.
  const preferred =
    matches.find((n) => n.audience === 'all') ||
    [...matches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  return preferred || null
}

export function noticeTypeFromTeamNotice(notice: TeamNotice | null): NoticeType {
  if (!notice) return 'info'
  if (notice.type === 'warning' || notice.type === 'system') return 'warning'
  if (notice.type === 'success') return 'success'
  return 'info'
}
