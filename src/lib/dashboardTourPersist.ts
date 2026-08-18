'use client'

import { hydrateCompletedTours, isTourKey, type TourKey } from '@/lib/dashboardTour'
import { baseUrl } from '@/redux/api/api'
import { updateUser } from '@/redux/features/auth/user.slice'
import { store } from '@/redux/store'

export function persistCompletedToursRemote(keys: TourKey[]) {
  const valid = keys.filter(isTourKey)
  if (!valid.length) return

  const current = store.getState().user.user?.completedTours ?? []
  const merged = [...new Set([...current, ...valid])]
  store.dispatch(updateUser({ completedTours: merged }))
  const uid = store.getState().user.user?.id
  if (uid) hydrateCompletedTours(uid, valid)

  const token = store.getState().user.token
  void fetch(`${baseUrl}/auth/tours`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ keys: valid }),
  })
    .then(async (res) => {
      if (!res.ok) return
      const body = (await res.json()) as { data?: { completedTours?: string[] } }
      const serverKeys = body?.data?.completedTours
      if (!Array.isArray(serverKeys)) return
      store.dispatch(updateUser({ completedTours: serverKeys.filter(isTourKey) }))
      const uid = store.getState().user.user?.id
      if (uid) hydrateCompletedTours(uid, serverKeys)
    })
    .catch(() => undefined)
}
