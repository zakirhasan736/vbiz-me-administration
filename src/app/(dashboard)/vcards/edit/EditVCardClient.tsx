'use client'

import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { CardScopeProvider } from '@/lib/card-scope'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { notify } from '@/lib/toast/toast'
import { VCardProvider } from '@/lib/VCardContext'
import {
  buildEditorPath,
  DEFAULT_EDITOR_SECTION,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import { useGetProfileQuery } from '@/redux/features/profiles/profiles.api'
import VCardEdit from '@/views/VCardEdit'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  segments?: string[]
}

function directoryPathForRole(role: string | undefined) {
  if (role === 'admin' || role === 'super-admin') return '/admin/mycards'
  if (role === 'corporate-owner') return '/teamvcard'
  return '/vcards'
}

export default function EditVCardClient({ segments }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = useAppSelector((state) => state.user.user?.role)
  const cardId = searchParams.get('cardId')
  const parsed = parseEditorSegments(segments)
  const { data: profile } = useGetProfileQuery(cardId || '', { skip: !cardId })

  useEffect(() => {
    if (!cardId) {
      router.replace(directoryPathForRole(role))
      return
    }

    if (profile && isOwnerCardLocked(profile.status?.name) && !isStaffRole(role)) {
      notify.info(SUSPENDED_CARD_MESSAGE)
      router.replace(directoryPathForRole(role))
      return
    }

    if (!segments || segments.length === 0) {
      router.replace(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, cardId))
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, cardId))
    }
  }, [cardId, parsed.sectionId, profile, role, router, segments])

  if (!cardId || !segments || segments.length === 0 || !isValidEditorSection(parsed.sectionId)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
        Redirecting…
      </div>
    )
  }

  return (
    <CardScopeProvider cardId={cardId} mode="edit">
      <VCardProvider>
        <VCardEdit basePath="/vcards/edit" segments={segments} cardId={cardId} />
      </VCardProvider>
    </CardScopeProvider>
  )
}
