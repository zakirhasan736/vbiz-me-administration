'use client'

import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { refreshSessionAccessToken } from '@/lib/auth/sessionClient'
import { requestSessionExpiryWarning, shouldSilentlyRefreshSession } from '@/lib/auth/sessionPolicy'
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

/**
 * Socket.IO overlay for dashboard overview KPIs (admin, single owner, corporate).
 * Deltas reset on period change so period-filtered REST totals stay the base.
 * Connects with cookies even when Redux Bearer is missing; refreshes on connect_error.
 */
export function useDashboardLiveKpis(period: DashboardPeriod) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((state) => state.user.token)
  const role = useAppSelector((state) => state.user.user?.role)
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
    const onConnectError = (error: Error) => {
      if (cancelled || refreshAttempted) return
      if (!/auth|unauthori[sz]ed|token|jwt|expired/i.test(error?.message || '')) return
      refreshAttempted = true

      if (!shouldSilentlyRefreshSession(role)) {
        requestSessionExpiryWarning('unauthorized')
        return
      }

      void refreshSessionAccessToken(token).then((accessToken) => {
        if (cancelled) return
        if (!accessToken) {
          requestSessionExpiryWarning('expired')
          return
        }
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
  }, [dispatch, role, token])

  return { overlay, connected }
}

export const useAdminDashboardLiveKpis = useDashboardLiveKpis

export default useDashboardLiveKpis
