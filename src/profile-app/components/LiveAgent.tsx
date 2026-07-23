'use client'

import { LiveAgentPanelV1 } from '@/profile-app/components/live-agent/LiveAgentPanelV1'
import { LiveAgentPanelV2 } from '@/profile-app/components/live-agent/LiveAgentPanelV2'
import { useLiveAgent, type UseLiveAgentOptions } from '@/profile-app/components/live-agent/useLiveAgent'
import { DEFAULT_LIVE_AGENT_CARD, type LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'
import { useCallback, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type LiveAgentVariant = 'v1' | 'v2'

export type LiveAgentProps = UseLiveAgentOptions & {
  /** v1 = gold concierge UI; v2 = zinc link-in-bio UI */
  variant?: LiveAgentVariant
  /** Scope UI to editor phone preview (not full-page viewport). */
  embedded?: boolean
  /** Accent for v1 gold controls (from card theme). */
  accentColor?: string
}

const PREVIEW_PHONE_SELECTOR = '.vbiz-preview-phone'

function getPreviewPhoneShell(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector(PREVIEW_PHONE_SELECTOR) as HTMLElement | null
}

function subscribeToPreviewPhoneShell(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

export function LiveAgent({
  variant = 'v2',
  accentColor,
  embedded = false,
  cardData = DEFAULT_LIVE_AGENT_CARD,
  readyToConnect = false,
}: LiveAgentProps) {
  const controller = useLiveAgent({ cardData, readyToConnect })

  const subscribe = useCallback(
    (onStoreChange: () => void) => (embedded ? subscribeToPreviewPhoneShell(onStoreChange) : () => {}),
    [embedded]
  )

  const getSnapshot = useCallback(() => (embedded ? getPreviewPhoneShell() : null), [embedded])

  const phoneShell = useSyncExternalStore(subscribe, getSnapshot, () => null)

  const panel =
    variant === 'v1' ? (
      <LiveAgentPanelV1 {...controller} embedded={embedded} accentColor={accentColor} />
    ) : (
      <LiveAgentPanelV2 {...controller} embedded={embedded} />
    )

  if (!embedded) return panel

  if (!phoneShell) return null

  return createPortal(
    <div className="vbiz-preview-live-agent pointer-events-none absolute right-3 bottom-3 z-110 flex flex-col items-end">
      {panel}
    </div>,
    phoneShell
  )
}

export type { LiveAgentCardData }
