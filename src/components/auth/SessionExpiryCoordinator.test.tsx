import { requestSessionExpiryWarning } from '@/lib/auth/sessionPolicy'
import userReducer, { updateAuthState } from '@/redux/features/auth/user.slice'
import { configureStore } from '@reduxjs/toolkit'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionExpiryCoordinator } from './SessionExpiryCoordinator'

function createAuthStore() {
  return configureStore({ reducer: { user: userReducer } })
}

function tokenWithExpiry(exp: number): string {
  const encode = (value: string) => btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${encode('{}')}.${encode(JSON.stringify({ exp }))}.${encode('{}')}`
}

describe('SessionExpiryCoordinator', () => {
  let container: HTMLDivElement
  let root: Root
  let authStore: ReturnType<typeof createAuthStore>

  beforeEach(() => {
    vi.useFakeTimers()
    window.history.replaceState({}, '', '/login')
    window.sessionStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    authStore = createAuthStore()
    authStore.dispatch(
      updateAuthState({
        user: { id: 'user-1', role: 'admin' },
        token: tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600),
        isLoading: false,
      })
    )
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    document.body.style.overflow = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows a 45-second countdown and signs out when it reaches zero', async () => {
    const onSignOut = vi.fn(async () => undefined)
    await act(async () => {
      root.render(
        <Provider store={authStore}>
          <SessionExpiryCoordinator onSignOut={onSignOut} />
        </Provider>
      )
    })

    await act(async () => requestSessionExpiryWarning('idle'))

    expect(document.body.textContent).toContain('Session expiring')
    expect(document.body.textContent).toContain('0:45')

    await act(async () => vi.advanceTimersByTime(44_000))
    expect(onSignOut).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(1_000))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('renews the token and closes the warning when the user stays logged in', async () => {
    const renewedToken = tokenWithExpiry(Math.floor(Date.now() / 1000) + 7200)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { accessToken: renewedToken } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    const onSignOut = vi.fn(async () => undefined)
    await act(async () => {
      root.render(
        <Provider store={authStore}>
          <SessionExpiryCoordinator onSignOut={onSignOut} />
        </Provider>
      )
    })
    await act(async () => requestSessionExpiryWarning('expired'))

    const stayButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Stay logged in')
    )
    expect(stayButton).toBeDefined()

    await act(async () => stayButton?.click())

    expect(authStore.getState().user.token).toBe(renewedToken)
    expect(document.body.textContent).not.toContain('Session expiring')
    expect(onSignOut).not.toHaveBeenCalled()
  })
})
