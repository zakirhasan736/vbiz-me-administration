import { notifyCardOwner, pushNotification } from '@/lib/notifications'
import type { Meeting } from '@/types/meeting'

type ScheduleNotifyInput = {
  meeting: Meeting
  hostName: string
  meetType: string
  meetDate: string
  meetTime: string
  profileId?: string | null
  ownerAudience?: 'single' | 'corporate'
}

/** Local admin + owner bell notifications after a meeting is booked (server handles email/push). */
export function notifyScheduleCreated(input: ScheduleNotifyInput) {
  const meetSuffix = input.meeting.meetLink ? ` · ${input.meeting.meetLink}` : ''
  const body = `${input.meetType} with ${input.hostName} on ${input.meetDate} at ${input.meetTime}${meetSuffix}`

  if (input.profileId && input.ownerAudience) {
    notifyCardOwner({
      ownerAudience: input.ownerAudience,
      category: 'event',
      title: 'Upcoming session scheduled',
      body,
      profileId: input.profileId,
      forceBrowser: true,
    })
  } else {
    ;(['single', 'corporate'] as const).forEach((audience) => {
      pushNotification({
        audience,
        category: 'event',
        title: 'Upcoming session scheduled',
        body,
        href: '/',
        forceBrowser: true,
      })
    })
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
