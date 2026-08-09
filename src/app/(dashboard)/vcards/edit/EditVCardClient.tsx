'use client'

import { useAppSelector } from '@/hooks/redux'
import { CardScopeProvider } from '@/lib/card-scope'
import { VCardProvider } from '@/lib/VCardContext'
import {
  DEFAULT_EDITOR_SECTION,
  buildEditorPath,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
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

  useEffect(() => {
    if (!cardId) {
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
  }, [cardId, parsed.sectionId, role, router, segments])

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
