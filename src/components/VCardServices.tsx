'use client'

import { ServicesEditorPanel } from '@/components/vcard/ServicesEditorPanel'
import { useVCard } from '@/lib/VCardContext'

export function TabServices() {
  const { vCardData, updateData } = useVCard()

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-7xl flex-col pb-12 duration-500">
      <ServicesEditorPanel
        services={vCardData.services}
        onServicesChange={(next) => updateData('services', next)}
        accent="indigo"
      />
    </div>
  )
}
