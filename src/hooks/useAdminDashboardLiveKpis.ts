'use client'

import { useAppSelector } from '@/hooks/redux'
import { baseUrl } from '@/redux/api/api'
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
 * Staff-only Socket.IO overlay for admin home KPIs.
 * Deltas reset on period change so period-filtered REST totals stay the base.
 */
export function useAdminDashboardLiveKpis(period: DashboardPeriod) {
  const token = useAppSelector((state) => state.user.token)
  const [overlay, setOverlay] = useState<LiveKpiOverlay>(EMPTY_OVERLAY)
  const [overlayPeriod, setOverlayPeriod] = useState(period)
  const [connected, setConnected] = useState(false)

  if (overlayPeriod !== period) {
    setOverlayPeriod(period)
    setOverlay(EMPTY_OVERLAY)
  }

  useEffect(() => {
    if (!token) return

    const socket: Socket = io(socketOriginFromApiUrl(baseUrl), {
      auth: { token },
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onKpi = (payload: DashboardKpiPayload) => {
      if (payload?.kind === 'view') {
        setOverlay((current) => ({ ...current, views: current.views + 1 }))
        return
      }
      if (payload?.kind === 'save') {
        setOverlay((current) => ({ ...current, saves: current.saves + 1 }))
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on(DASHBOARD_KPI_EVENT, onKpi)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off(DASHBOARD_KPI_EVENT, onKpi)
      socket.disconnect()
    }
  }, [token])

  return { overlay, connected: Boolean(token) && connected }
}

export default useAdminDashboardLiveKpis
