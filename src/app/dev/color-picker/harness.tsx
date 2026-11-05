'use client'

import { CustomColorPicker } from '@/components/color/CustomColorPicker'
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'vbiz-color-picker-harness'
const CHANGE_EVENT = 'vbiz-color-harness'

type SavedColors = { primary: string; secondary: string }

const FALLBACK: SavedColors = { primary: '#112233', secondary: '#eed677' }

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange)
}

function readSaved(): SavedColors {
  if (typeof window === 'undefined') return FALLBACK
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return FALLBACK
    const saved = JSON.parse(raw) as Partial<SavedColors>
    return {
      primary: saved.primary || FALLBACK.primary,
      secondary: saved.secondary || FALLBACK.secondary,
    }
  } catch {
    return FALLBACK
  }
}

function getSnapshot(): string {
  return JSON.stringify(readSaved())
}

function getServerSnapshot(): string {
  return JSON.stringify(FALLBACK)
}

function writeSaved(next: SavedColors) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function ColorPickerHarness() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const colors = JSON.parse(raw) as SavedColors

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <h1>Color picker harness</h1>
      <p data-testid="saved-colors">
        {colors.primary} {colors.secondary}
      </p>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <CustomColorPicker
          label="Primary"
          value={colors.primary}
          onChange={(primary) => writeSaved({ ...colors, primary })}
        />
        <CustomColorPicker
          label="Secondary"
          value={colors.secondary}
          onChange={(secondary) => writeSaved({ ...colors, secondary })}
        />
      </div>
      <div style={{ height: '110vh' }} />
      <div style={{ position: 'fixed', right: 12, bottom: 12 }}>
        <CustomColorPicker
          label="Edge"
          value={colors.primary}
          onChange={(primary) => writeSaved({ ...colors, primary })}
        />
      </div>
      <button type="button" onClick={() => writeSaved(colors)}>
        Save colors
      </button>
    </main>
  )
}
