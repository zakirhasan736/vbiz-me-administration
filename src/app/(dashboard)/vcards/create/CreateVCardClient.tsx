'use client'

import { CardScopeProvider } from '@/lib/card-scope'
import { VCardProvider } from '@/lib/VCardContext'
import {
  DEFAULT_EDITOR_SECTION,
  buildEditorPath,
  isValidEditorSection,
  parseEditorSegments,
} from '@/lib/vcardEditorRoutes'
import VCardEdit from '@/views/VCardEdit'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  segments?: string[]
}

export default function CreateVCardClient({ segments }: Props) {
  const router = useRouter()
  const parsed = parseEditorSegments(segments)

  useEffect(() => {
    if (!segments || segments.length === 0) {
      router.replace(buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION }))
      return
    }

    if (!isValidEditorSection(parsed.sectionId)) {
      router.replace(buildEditorPath('/vcards/create', { sectionId: DEFAULT_EDITOR_SECTION }))
    }
  }, [parsed.sectionId, router, segments])

  if (!segments || segments.length === 0 || !isValidEditorSection(parsed.sectionId)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
        Redirecting…
      </div>
    )
  }

  return (
    <CardScopeProvider cardId={null} mode="create">
      <VCardProvider>
        <VCardEdit basePath="/vcards/create" segments={segments} />
      </VCardProvider>
    </CardScopeProvider>
  )
}
