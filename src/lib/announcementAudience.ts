import type { Announcement } from '@/types/announcement'

export type AnnouncementAudienceInfo = {
  scopeLabel: string
  cardLabel: string | null
  visibilityLabel: string
  isCardScoped: boolean
}

/** Human labels for admin announcement lists (global vs single card + where it shows). */
export function describeAnnouncementAudience(notice: Announcement): AnnouncementAudienceInfo {
  const profileId = notice.meta?.profileId?.trim() || ''
  const isCardScoped = notice.targetType === 'specific' || Boolean(profileId)
  const isPublic = notice.meta?.showPublic === '1'
  const onlyBackoffice = notice.meta?.onlyBackoffice === '1' || (isCardScoped && !isPublic)

  let cardLabel: string | null = null
  if (isCardScoped) {
    const fromTitle = notice.title?.match(/Card notice\s*[·•\-–—]\s*(.+)$/i)?.[1]?.trim()
    if (fromTitle) cardLabel = fromTitle
    else if (notice.targetEmails?.[0]) cardLabel = notice.targetEmails[0]
    else if (profileId) cardLabel = `Card ${profileId.slice(0, 8)}…`
    else cardLabel = 'Selected card'
  }

  return {
    scopeLabel: isCardScoped ? 'Single card' : 'Global',
    cardLabel,
    visibilityLabel: onlyBackoffice ? 'Backoffice only' : isPublic ? 'Public + backoffice' : 'Backoffice',
    isCardScoped,
  }
}
