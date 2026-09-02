import { deriveOwnerAudience } from '@/lib/meetingScope'
import { notifyCardOwner, pushNotification } from '@/lib/notifications'
import type { Meeting, MeetingScope } from '@/types/meeting'

type ScheduleNotifyInput = {
  meeting: Meeting
  hostName: string
  meetType: string
  meetDate: string
  meetTime: string
  scope?: MeetingScope
  profileId?: string | null
  groupProfileIds?: string[]
  ownerAudience?: 'single' | 'corporate'
  ownerRole?: string | null
  companyUserRole?: string | null
}

function resolvedScope(input: ScheduleNotifyInput): MeetingScope {
  return input.scope ?? input.meeting.scope ?? (input.profileId || input.meeting.profileId ? 'one_to_one' : 'global')
}

/** Local admin + owner bell notifications after a meeting is booked (server handles email/push). */
export function notifyScheduleCreated(input: ScheduleNotifyInput) {
  const meetSuffix = input.meeting.meetLink ? ` · ${input.meeting.meetLink}` : ''
  const body = `${input.meetType} with ${input.hostName} on ${input.meetDate} at ${input.meetTime}${meetSuffix}`
  const scope = resolvedScope(input)

  if (scope === 'global') {
    ;(['single', 'corporate'] as const).forEach((audience) => {
      pushNotification({
        audience,
        category: 'event',
        title: 'Upcoming platform session scheduled',
        body,
        href: '/',
        forceBrowser: true,
      })
    })
  } else if (scope === 'group') {
    const profileIds = (input.groupProfileIds?.length ? input.groupProfileIds : input.meeting.groupProfileIds) || []
    const audience = input.ownerAudience ?? deriveOwnerAudience(input.ownerRole, input.companyUserRole)
    for (const profileId of profileIds) {
      notifyCardOwner({
        ownerAudience: audience,
        category: 'event',
        title: 'Upcoming group session scheduled',
        body,
        profileId,
        forceBrowser: true,
      })
    }
  } else {
    const profileId = input.profileId ?? input.meeting.profileId
    if (profileId) {
      notifyCardOwner({
        ownerAudience: input.ownerAudience ?? deriveOwnerAudience(input.ownerRole, input.companyUserRole),
        category: 'event',
        title: 'Upcoming session scheduled',
        body,
        profileId,
        forceBrowser: true,
      })
    }
  }

  pushNotification({
    audience: 'admin',
    category: 'event',
    title: 'New session booked',
    body,
    href: '/admin/schedule',
    forceBrowser: true,
  })
}

export function meetLinkLabel(meetLink?: string | null) {
  if (!meetLink) return null
  if (/meeting\.zoho\./i.test(meetLink)) return 'Zoho Meeting'
  if (/meet\.google\./i.test(meetLink)) return 'Google Meet'
  return 'Join meeting'
}
