'use client'

import { useCardScopeId } from '@/lib/card-scope'
import { CardNoticeModal } from '@/profile-app/components/CardNoticeModal'
import { getOrCreateGuestId } from '@/profile-app/lib/guestId'
import { useProfileIntroContextOptional } from '@/profile-app/providers/ProfileIntroProvider'
import {
  useDismissPublicProfileTeamNoticeMutation,
  useGetPublicProfileTeamNoticeQuery,
} from '@/redux/features/publicAnnouncements/publicAnnouncements.api'
import { useMemo, useState } from 'react'

type Props = {
  embedded?: boolean
  profileSlug?: string
  ownerName?: string
  teamNotices?: unknown
}

/**
 * After intro skip / end, show the latest active owner/corporate card notice once per 24 hours.
 */
export function CardNoticeAfterIntro({ embedded, profileSlug, ownerName }: Props) {
  const intro = useProfileIntroContextOptional()
  const profileId = useCardScopeId()
  const slug = profileSlug?.trim() || ''
  const visitorId = useMemo(() => getOrCreateGuestId(), [])
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [dismissTeamNotice] = useDismissPublicProfileTeamNoticeMutation()
  const { data: notice } = useGetPublicProfileTeamNoticeQuery(
    { profileId: profileId || '', visitorId, origin: 'owner' },
    {
      skip: !profileId || !slug || embedded || !intro?.introAllowed,
      pollingInterval: 60_000,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  )
  const noticeId = notice?.id

  const eligible =
    !embedded &&
    Boolean(intro) &&
    Boolean(notice) &&
    Boolean(slug) &&
    Boolean(intro?.introAllowed) &&
    !intro?.showPreloader &&
    Boolean(profileId)

  const open = Boolean(eligible && noticeId && dismissedId !== noticeId)

  const handleClose = async () => {
    if (noticeId) setDismissedId(noticeId)
    if (!notice || !profileId) return
    try {
      await dismissTeamNotice({ profileId, noticeId: notice.id, visitorId }).unwrap()
    } catch {
      setDismissedId(null)
    }
  }

  return (
    <CardNoticeModal open={open} notice={notice ?? null} ownerName={ownerName} onClose={() => void handleClose()} />
  )
}
