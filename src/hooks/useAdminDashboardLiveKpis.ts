'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { baseUrl } from '@/redux/api/api'
import { updateAuthState } from '@/redux/features/auth/user.slice'
import type { DashboardPeriod } from '@/redux/features/profiles/profiles.api'
import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

export type LiveKpiOverlay = {
  views: number
  saves: number
}

const DASHBOARD_KPI_EVENT = 'dashboard:kpi'
const EMPTY_OVERLAY: LiveKpiOverlay = { views: 0, saves: 0 }

type DashboardKpiPayload = {
  kind?: 'view' | 'save'
}

function socketOriginFromApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/api\/v1\/?$/, '')
}

async function hydrateAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null

    const body = (await res.json()) as {
      success?: boolean
      data?: { accessToken?: string }
    }
    return body?.success && body?.data?.accessToken ? body.data.accessToken : null
  } catch {
    return null
  }
}

/**
 * Staff-only Socket.IO overlay for admin home KPIs.
 * Deltas reset on period change so period-filtered REST totals stay the base.
 * Connects with cookies even when Redux Bearer is missing; refreshes on connect_error.
 */
export function useAdminDashboardLiveKpis(period: DashboardPeriod) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.user.token)
  const [overlay, setOverlay] = useState<LiveKpiOverlay>(EMPTY_OVERLAY)
  const [overlayPeriod, setOverlayPeriod] = useState(period)
  const [connected, setConnected] = useState(false)

  if (overlayPeriod !== period) {
    setOverlayPeriod(period)
    setOverlay(EMPTY_OVERLAY)
  }

  useEffect(() => {
    let cancelled = false
    let refreshAttempted = false

    const socket: Socket = io(socketOriginFromApiUrl(baseUrl), {
      auth: token ? { token } : {},
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    const onConnect = () => {
      if (!cancelled) setConnected(true)
    }
    const onDisconnect = () => {
      if (!cancelled) setConnected(false)
    }
    const onKpi = (payload: DashboardKpiPayload) => {
      if (payload?.kind === 'view') {
        setOverlay((current) => ({ ...current, views: current.views + 1 }))
        return
      }
      if (payload?.kind === 'save') {
        setOverlay((current) => ({ ...current, saves: current.saves + 1 }))
      }
    }
    const onConnectError = () => {
      if (cancelled || refreshAttempted) return
      refreshAttempted = true
      void hydrateAccessToken().then((accessToken) => {
        if (cancelled || !accessToken) return
        dispatch(updateAuthState({ token: accessToken }))
        socket.auth = { token: accessToken }
        socket.connect()
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on(DASHBOARD_KPI_EVENT, onKpi)
    socket.on('connect_error', onConnectError)

    return () => {
      cancelled = true
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off(DASHBOARD_KPI_EVENT, onKpi)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
    }
  }, [dispatch, token])

  return { overlay, connected }
}

export default useAdminDashboardLiveKpis
