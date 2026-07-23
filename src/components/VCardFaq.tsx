'use client'

import { FaqEditorPanel } from '@/components/vcard/FaqEditorPanel'
import { useVCard } from '@/lib/VCardContext'

export function TabFaq() {
  const { vCardData, updateData } = useVCard()

  return <FaqEditorPanel faqs={vCardData.faqs} onFaqsChange={(next) => updateData('faqs', next)} />
}
