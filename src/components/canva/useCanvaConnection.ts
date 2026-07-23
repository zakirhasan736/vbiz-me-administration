'use client'

import { disconnectCanvaAction, getCanvaConnectionStatusAction, startCanvaAuthAction } from '@/lib/canva/actions'
import type { CanvaConnectionStatus } from '@/lib/canva/types'
import { useCallback, useEffect, useState } from 'react'

type UseCanvaConnectionOptions = {
  userId?: string | null
  returnTo?: string
  enabled?: boolean
}

function applyStatusSuccess(
  key: string,
  nextStatus: CanvaConnectionStatus,
  setStatus: (status: CanvaConnectionStatus) => void,
  setResolvedKey: (key: string) => void,
  setError: (error: string | null) => void
) {
  setStatus(nextStatus)
  setResolvedKey(key)
  setError(null)
}

function applyStatusFailure(
  key: string,
  err: unknown,
  setStatus: (status: CanvaConnectionStatus) => void,
  setResolvedKey: (key: string) => void,
  setError: (error: string | null) => void
) {
  setStatus({ connected: false })
  setResolvedKey(key)
  setError(err instanceof Error ? err.message : 'Failed to load Canva status')
}

export function useCanvaConnection({ userId, returnTo, enabled = true }: UseCanvaConnectionOptions) {
  const requestKey = enabled && userId ? userId : null

  const [status, setStatus] = useState<CanvaConnectionStatus>({ connected: false })
  const [resolvedKey, setResolvedKey] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLoading = (requestKey !== null && resolvedKey !== requestKey) || isRefreshing
  const isConnected = requestKey ? status.connected : false

  useEffect(() => {
    if (!requestKey) return

    let cancelled = false

    void getCanvaConnectionStatusAction(requestKey)
      .then((nextStatus) => {
        if (cancelled) return
        applyStatusSuccess(requestKey, nextStatus, setStatus, setResolvedKey, setError)
      })
      .catch((err) => {
        if (cancelled) return
        applyStatusFailure(requestKey, err, setStatus, setResolvedKey, setError)
      })

    return () => {
      cancelled = true
    }
  }, [requestKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const canvaResult = params.get('canva')

    if (!canvaResult) return

    const canvaError = params.get('canva_error')

    params.delete('canva')
    params.delete('canva_error')

    const nextSearch = params.toString()
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', nextUrl)

    if (canvaResult === 'connected' && requestKey) {
      let cancelled = false

      void getCanvaConnectionStatusAction(requestKey)
        .then((nextStatus) => {
          if (cancelled) return
          applyStatusSuccess(requestKey, nextStatus, setStatus, setResolvedKey, setError)
        })
        .catch((err) => {
          if (cancelled) return
          applyStatusFailure(requestKey, err, setStatus, setResolvedKey, setError)
        })

      return () => {
        cancelled = true
      }
    }

    if (canvaResult === 'error') {
      void Promise.resolve().then(() => {
        setError(canvaError || 'Canva connection failed')
      })
    }
  }, [requestKey])

  const refreshStatus = useCallback(async () => {
    if (!requestKey) return

    setIsRefreshing(true)
    setError(null)

    try {
      const nextStatus = await getCanvaConnectionStatusAction(requestKey)
      applyStatusSuccess(requestKey, nextStatus, setStatus, setResolvedKey, setError)
    } catch (err) {
      applyStatusFailure(requestKey, err, setStatus, setResolvedKey, setError)
    } finally {
      setIsRefreshing(false)
    }
  }, [requestKey])

  const connect = useCallback(async () => {
    if (!userId) {
      setError('You must be signed in to connect Canva')
      return
    }

    setError(null)

    const nextReturnTo =
      returnTo || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')

    await startCanvaAuthAction(userId, nextReturnTo)
  }, [returnTo, userId])

  const disconnect = useCallback(async () => {
    if (!requestKey) return

    setIsRefreshing(true)
    setError(null)

    try {
      await disconnectCanvaAction(requestKey)
      setStatus({ connected: false })
      setResolvedKey(requestKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Canva')
    } finally {
      setIsRefreshing(false)
    }
  }, [requestKey])

  return {
    isConnected,
    status: requestKey ? status : { connected: false },
    isLoading,
    error,
    connect,
    disconnect,
    refreshStatus,
  }
}
