'use client'

import { AI_CARD_AGENT_DATASET, AI_CARD_AGENT_EVENT, readAiCardAgentOpen } from '@/lib/dashboardTour'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAiCardAgentOpen() {
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get('agent') === '1'
  const [fromDom, setFromDom] = useState(false)

  useEffect(() => {
    const sync = () => {
      setFromDom(document.documentElement.dataset[AI_CARD_AGENT_DATASET] === '1' || readAiCardAgentOpen())
    }
    sync()
    window.addEventListener(AI_CARD_AGENT_EVENT, sync)
    return () => window.removeEventListener(AI_CARD_AGENT_EVENT, sync)
  }, [searchParams])

  return fromUrl || fromDom
}
