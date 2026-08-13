'use client'

import { CreateAgentUiProvider } from '@/components/vcard/create-agent/CreateAgentUiProvider'
import { EditorBootSkeleton } from '@/components/vcard/EditorBootSkeleton'
import { LivePreviewProvider } from '@/components/vcard/LivePreviewProvider'
import { VCardLivePreview } from '@/components/VCardLivePreview'
import { useAppSelector } from '@/hooks/redux'
import { CardScopeProvider } from '@/lib/card-scope'
import { useEditorPathname } from '@/lib/editorShallowRoute'
import { notify } from '@/lib/toast/toast'
import { VCardProvider } from '@/lib/VCardContext'
import {
  buildEditorPath,
  buildEditorSectionPath,
  DEFAULT_EDITOR_SECTION,
  editorSegmentsFromPathname,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import { storageKeyForEditorNavOrder } from '@/lib/vcardNavbar'
import { useGetProfilesQuery } from '@/redux/features/profiles/profiles.api'
import VCardEdit from '@/views/VCardEdit'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'

/**
 * The create shell lives in the layout so section URLs (`/vcards/create/services`)
 * never remount the draft, the AI wizard, or the live preview.
 */
function CreateVCardShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = useEditorPathname()
  const resetKey = searchParams.get('reset') || 'default'
  const agentQuery = searchParams.get('agent') === '1' ? 'agent=1' : ''
  const resetParam = searchParams.get('reset')
  const resetQuery = resetParam ? `reset=${encodeURIComponent(resetParam)}` : ''
  const createQuery = [agentQuery, resetQuery].filter(Boolean).join('&')
  const createQuerySuffix = createQuery ? `?${createQuery}` : ''
  const role = useAppSelector((state) => state.user.user?.role)
  const { data: profilesResult, isLoading } = useGetProfilesQuery({ limit: 100 })
  const segments = useMemo(() => editorSegmentsFromPathname(pathname, '/vcards/create'), [pathname])
  const parsed = parseEditorSegments(segments)
  const profiles = useMemo(() => profilesResult?.items ?? [], [profilesResult?.items])
  const capacity = profilesResult?.capacity
  const isPersonal = role === 'vcard-owner'
  const isCorporate = role === 'corporate-owner'
  const blockedByPersonalLimit = isPersonal && !isLoading && (capacity ? !capacity.canCreate : profiles.length >= 1)
  const blockedByCorporateLimit = isCorporate && !isLoading && capacity != null && !capacity.canCreate
  const blockedByLimit = blockedByPersonalLimit || blockedByCorporateLimit
  const toastShown = useRef(false)

  // Clear draft nav only when a new create session starts (reset token changes)
  useEffect(() => {
    if (!resetKey || resetKey === 'default') return
    try {
      localStorage.removeItem(storageKeyForEditorNavOrder('draft'))
    } catch {
      /* ignore */
    }
  }, [resetKey])

  useEffect(() => {
    if (blockedByCorporateLimit) {
      if (!toastShown.current) {
        toastShown.current = true
        notify.warning(
          capacity && capacity.limit <= 0
            ? 'No active package with card capacity. Upgrade your package to create cards.'
            : `Maximum of ${capacity?.limit ?? 0} corporate cards reached`
        )
      }
      router.replace('/teamvcard')
      return
    }

    if (blockedByPersonalLimit) {
      const existingId = profiles[0]?.id
      if (existingId) {
        router.replace(buildEditorSectionPath('/vcards/edit', 'home', existingId))
      } else {
        router.replace('/vcards')
      }
      return
    }

    if (segments.length === 0) {
      router.replace(`${buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION })}${createQuerySuffix}`)
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(`${buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION })}${createQuerySuffix}`)
    }
  }, [
    createQuerySuffix,
    blockedByCorporateLimit,
    blockedByPersonalLimit,
    capacity,
    parsed.sectionId,
    profiles,
    router,
    segments,
  ])

  if (blockedByLimit || isLoading) {
    return (
      <EditorBootSkeleton
        message={
          blockedByCorporateLimit
            ? 'Redirecting to Team vCards…'
            : blockedByPersonalLimit
              ? 'Redirecting to your existing vCard…'
              : undefined
        }
      />
    )
  }

  if (segments.length === 0 || !isValidEditorSection(parsed.sectionId)) {
    return <EditorBootSkeleton message="Opening editor…" />
  }

  return (
    <CardScopeProvider cardId={null} mode="create">
      <VCardProvider key={resetKey}>
        {/* Wizard host stays mounted across /create section URL changes */}
        <CreateAgentUiProvider>
          <LivePreviewProvider>
            <VCardEdit basePath="/vcards/create" segments={segments} />
            <VCardLivePreview />
            {children}
          </LivePreviewProvider>
        </CreateAgentUiProvider>
      </VCardProvider>
    </CardScopeProvider>
  )
}

export default function CreateVCardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<EditorBootSkeleton />}>
      <CreateVCardShell>{children}</CreateVCardShell>
    </Suspense>
  )
}
