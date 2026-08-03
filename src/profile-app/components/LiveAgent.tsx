'use client'

import { ExternalIntentPrompt } from '@/profile-app/components/ExternalIntentPrompt'
import { LiveAgentPanel } from '@/profile-app/components/live-agent/LiveAgentPanel'
import type { UseLiveAgentOptions } from '@/profile-app/components/live-agent/useLiveAgent'
import { isInIframe } from '@/profile-app/lib/isInIframe'
import { DEFAULT_LIVE_AGENT_CARD, type LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'
import { useCallback, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type LiveAgentProps = UseLiveAgentOptions & {
  embedded?: boolean
  /** Accent from the card theme (`design.accentColor`). */
  accentColor?: string
  /** Overrides the floating wrapper position classes (e.g. per-template placement). */
  wrapperClassName?: string
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

/** Shared live agent (central configuration & UI) for all profile templates. */
export function LiveAgent({
  accentColor,
  embedded = false,
  cardData = DEFAULT_LIVE_AGENT_CARD,
  systemInstruction,
  readyToConnect = false,
  wrapperClassName,
}: LiveAgentProps) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => (embedded ? subscribeToPreviewPhoneShell(onStoreChange) : () => {}),
    [embedded]
  )

  const getSnapshot = useCallback(() => (embedded ? getPreviewPhoneShell() : null), [embedded])

  const phoneShell = useSyncExternalStore(subscribe, getSnapshot, () => null)

  if (isInIframe()) return null

  const panel = (
    <>
      <LiveAgentPanel
        accentColor={accentColor}
        cardData={cardData}
        systemInstruction={systemInstruction}
        readyToConnect={readyToConnect}
        embedded={embedded}
        wrapperClassName={wrapperClassName}
      />
      {!embedded ? <ExternalIntentPrompt /> : null}
    </>
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
