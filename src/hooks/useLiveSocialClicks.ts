'use client'

import { useAppSelector } from '@/hooks/redux'
import { baseUrl } from '@/redux/api/api'
import type { LiveSocialClickRow } from '@/redux/features/profiles/profiles.api'
import { useCallback, useEffect, useState } from 'react'

type SeedChannel = {
  channel: string
  label: string
  count: number
}

function parseSseChunk(buffer: string, onEvent: (event: string, data: string) => void): string {
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const block of parts) {
    let eventName = 'message'
    const dataLines: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (dataLines.length) onEvent(eventName, dataLines.join('\n'))
  }
  return rest
}

function seedRows(seed?: SeedChannel[]): LiveSocialClickRow[] {
  if (!seed?.length) return []
  return seed
    .filter((c) => c.count > 0)
    .map((c) => ({
      channel: c.channel,
      label: c.label,
      clickCount: c.count,
    }))
    .sort((a, b) => b.clickCount - a.clickCount)
}

/**
 * Authenticated SSE for live social-click totals.
 * Uses fetch + ReadableStream so Bearer auth matches the rest of the app.
 */
export function useLiveSocialClicks(seed?: SeedChannel[]) {
  const token = useAppSelector((s) => s.user.token)
  const [liveClicks, setLiveClicks] = useState<LiveSocialClickRow[] | null>(null)
  const [connected, setConnected] = useState(false)
  const clicks = liveClicks ?? seedRows(seed)

  const applyPayload = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as { clicks?: LiveSocialClickRow[] }
      if (Array.isArray(parsed.clicks)) setLiveClicks(parsed.clicks)
    } catch {
      // Ignore malformed frames.
    }
  }, [])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    let abort: AbortController | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const connect = async () => {
      if (cancelled) return
      abort = new AbortController()
      try {
        const res = await fetch(`${baseUrl}/profiles/dashboard/live-clicks`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: abort.signal,
        })
        if (!res.ok || !res.body) {
          throw new Error(`SSE ${res.status}`)
        }
        setConnected(true)
        attempt = 0
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          buffer = parseSseChunk(buffer, (event, data) => {
            if (event === 'snapshot' || event === 'click_update') applyPayload(data)
          })
        }
      } catch {
        // Retry below unless aborted.
      } finally {
        setConnected(false)
      }

      if (cancelled) return
      attempt += 1
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5))
      retryTimer = setTimeout(connect, delay)
    }

    void connect()

    return () => {
      cancelled = true
      abort?.abort()
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [token, applyPayload])

  return { clicks, connected }
}
