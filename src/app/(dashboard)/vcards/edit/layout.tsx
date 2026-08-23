'use client'

import { CreateAgentUiProvider } from '@/components/vcard/create-agent/CreateAgentUiProvider'
import { EditorBootSkeleton } from '@/components/vcard/EditorBootSkeleton'
import { LivePreviewProvider } from '@/components/vcard/LivePreviewProvider'
import { VCardLivePreview } from '@/components/VCardLivePreview'
import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import { useOwnerMode } from '@/hooks/useOwnerMode'
import { CardScopeProvider } from '@/lib/card-scope'
import { isOwnerCardLocked, SUSPENDED_CARD_MESSAGE } from '@/lib/cardStatus'
import { useEditorPathname } from '@/lib/editorShallowRoute'
import { directoryPathForOwnerMode } from '@/lib/packageOwnerMode'
import { notify } from '@/lib/toast/toast'
import { VCardProvider } from '@/lib/VCardContext'
import {
  buildEditorPath,
  DEFAULT_EDITOR_SECTION,
  editorSegmentsFromPathname,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import { useGetProfileQuery } from '@/redux/features/profiles/profiles.api'
import VCardEdit from '@/views/VCardEdit'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, type ReactNode } from 'react'

/**
 * The editor shell lives in the layout so section URLs (`/vcards/edit/services`)
 * never remount the draft, the form state, or the live preview.
 */
function VCardEditShell({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = useEditorPathname()
  const role = useAppSelector((state) => state.user.user?.role)
  const { ownerMode } = useOwnerMode()
  const directoryPath = directoryPathForOwnerMode(ownerMode, role)
  const cardId = searchParams.get('cardId')
  const segments = useMemo(() => editorSegmentsFromPathname(pathname, '/vcards/edit'), [pathname])
  const parsed = parseEditorSegments(segments)
  const { data: profile } = useGetProfileQuery(cardId || '', { skip: !cardId })

  useEffect(() => {
    if (!cardId) {
      router.replace(directoryPath)
      return
    }

    if (profile && isOwnerCardLocked(profile.status?.name) && !isStaffRole(role)) {
      notify.info(SUSPENDED_CARD_MESSAGE)
      router.replace(directoryPath)
      return
    }

    if (segments.length === 0) {
      router.replace(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, cardId))
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(buildEditorPath('/vcards/edit', { sectionId: DEFAULT_EDITOR_SECTION }, cardId))
    }
  }, [cardId, directoryPath, parsed.sectionId, profile, role, router, segments])

  if (!cardId || segments.length === 0 || !isValidEditorSection(parsed.sectionId)) {
    return <EditorBootSkeleton message="Opening editor…" />
  }

  return (
    <CardScopeProvider cardId={cardId} mode="edit">
      <VCardProvider>
        <CreateAgentUiProvider>
          <LivePreviewProvider>
            <VCardEdit basePath="/vcards/edit" segments={segments} cardId={cardId} />
            <VCardLivePreview />
            {children}
          </LivePreviewProvider>
        </CreateAgentUiProvider>
      </VCardProvider>
    </CardScopeProvider>
  )
}

export default function VCardEditLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<EditorBootSkeleton />}>
      <VCardEditShell>{children}</VCardEditShell>
    </Suspense>
  )
}
