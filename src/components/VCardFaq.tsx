'use client'

import { FaqEditorPanel } from '@/components/vcard/FaqEditorPanel'
import { useVCard } from '@/lib/VCardContext'

export function TabFaq() {
  const { vCardData, updateData, cardId } = useVCard()

  return <FaqEditorPanel faqs={vCardData.faqs} profileId={cardId} onFaqsChange={(next) => updateData('faqs', next)} />
}
