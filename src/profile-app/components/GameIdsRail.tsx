'use client'

import { IconHoverTooltip } from '@/profile-app/components/IconHoverTooltip'
import { copyGameIdToClipboard, getVisibleGameIds, type VisibleGameId } from '@/profile-app/lib/profileGameIds'
import { Gamepad2 } from 'lucide-react'
import { useCallback, useMemo, useState, type CSSProperties } from 'react'

type GameIdsRailProps = {
  games: Record<string, string> | undefined | null
  /** Extra classes on each icon button (chrome styles applied by parent when needed). */
  buttonClassName: string
  iconSize?: number
  tooltipPlacement?: 'top' | 'right' | 'left' | 'bottom'
  /** Optional style per button (e.g. social chrome). */
  buttonStyle?: CSSProperties
  /**
   * When set, icons render inside a single wrapper (use for a dedicated Game IDs row).
   * When omitted, icons render as siblings (vertical mobile rails).
   */
  wrapperClassName?: string
}

export function GameIdsRail({
  games,
  buttonClassName,
  iconSize = 22,
  tooltipPlacement = 'right',
  buttonStyle,
  wrapperClassName,
}: GameIdsRailProps) {
  const items = useMemo(() => getVisibleGameIds(games), [games])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const onCopy = useCallback(async (item: VisibleGameId) => {
    const ok = await copyGameIdToClipboard(item.value)
    if (!ok) return
    setCopiedId(item.id)
    window.setTimeout(() => setCopiedId((cur) => (cur === item.id ? null : cur)), 1500)
  }, [])

  if (items.length === 0) return null

  const buttons = items.map((item) => {
    const tip = copiedId === item.id ? `Copied ${item.label}` : item.label
    return (
      <IconHoverTooltip key={item.id} label={tip} placement={tooltipPlacement}>
        <button
          type="button"
          className={buttonClassName}
          style={buttonStyle}
          aria-label={`Copy ${item.label} ID`}
          onClick={() => void onCopy(item)}
        >
          <Gamepad2 size={iconSize} />
        </button>
      </IconHoverTooltip>
    )
  })

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{buttons}</div>
  }

  return <>{buttons}</>
}
