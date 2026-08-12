'use client'

import { CardNoticeModal } from '@/profile-app/components/CardNoticeModal'
import { useProfileIntroContextOptional } from '@/profile-app/providers/ProfileIntroProvider'
import type { MyCardTeamNotice } from '@interfaces/api/myCard'
import { useMemo, useState, useSyncExternalStore } from 'react'

const SESSION_PREFIX = 'vbiz_card_notice_seen:'

function sessionKey(slug: string, noticeId: string) {
  return `${SESSION_PREFIX}${slug}:${noticeId}`
}

function hasSeenNotice(slug: string, noticeId: string): boolean {
  if (typeof window === 'undefined' || !slug || !noticeId) return true
  try {
    return sessionStorage.getItem(sessionKey(slug, noticeId)) === '1'
  } catch {
    return false
  }
}

function markNoticeSeen(slug: string, noticeId: string) {
  if (typeof window === 'undefined' || !slug || !noticeId) return
  try {
    sessionStorage.setItem(sessionKey(slug, noticeId), '1')
  } catch {
    /* ignore */
  }
}

function pickActiveNotice(notices: MyCardTeamNotice[] | null | undefined): MyCardTeamNotice | null {
  if (!notices?.length) return null
  const active = notices.filter((n) => (n.status || 'active') === 'active' && Boolean(n.text?.trim()))
  if (!active.length) return null
  return [...active].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
}

function useHasSeenNotice(slug: string, noticeId: string | undefined): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => (noticeId ? hasSeenNotice(slug, noticeId) : true),
    () => true
  )
}

type Props = {
  embedded?: boolean
  profileSlug?: string
  ownerName?: string
  teamNotices?: MyCardTeamNotice[] | null
}

/**
 * After intro skip / end, show the latest active owner/corporate card notice once per session.
 */
export function CardNoticeAfterIntro({ embedded, profileSlug, ownerName, teamNotices }: Props) {
  const intro = useProfileIntroContextOptional()
  const notice = useMemo(() => pickActiveNotice(teamNotices), [teamNotices])
  const slug = profileSlug?.trim() || ''
  const noticeId = notice?.id
  const hasSeen = useHasSeenNotice(slug, noticeId)
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const eligible =
    !embedded &&
    Boolean(intro) &&
    Boolean(notice) &&
    Boolean(slug) &&
    Boolean(intro?.introAllowed) &&
    !intro?.showPreloader &&
    !hasSeen

  const open = Boolean(eligible && noticeId && dismissedId !== noticeId)

  const handleClose = () => {
    if (notice) markNoticeSeen(slug, notice.id)
    if (noticeId) setDismissedId(noticeId)
  }

  return <CardNoticeModal open={open} notice={notice} ownerName={ownerName} onClose={handleClose} />
}
