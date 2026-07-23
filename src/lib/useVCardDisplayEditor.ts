'use client'

import { useVCard } from '@/lib/VCardContext'
import { getDisplaySettingsFromVCard, patchDisplayField } from '@/lib/vcardDisplaySettings'
import type { DisplayFieldConfig, VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { useCallback, useMemo } from 'react'

/** Read/write Card Settings field keys (customValue, visibility, colors) from Personal tabs. */
export function useVCardDisplayEditor() {
  const { vCardData, updateData } = useVCard()

  const display = useMemo(() => getDisplaySettingsFromVCard(vCardData), [vCardData])

  const patchDisplay = useCallback((next: VCardDisplaySettings) => updateData('displaySettings', next), [updateData])

  const patchField = useCallback(
    (key: string, patch: Partial<DisplayFieldConfig>) => {
      patchDisplay(patchDisplayField(display, key, patch))
    },
    [display, patchDisplay]
  )

  const getCustomValue = useCallback((key: string) => display.fields[key]?.customValue?.trim() ?? '', [display])

  const setCustomValue = useCallback(
    (key: string, value: string) => patchField(key, { customValue: value }),
    [patchField]
  )

  return { display, patchDisplay, patchField, getCustomValue, setCustomValue }
}
