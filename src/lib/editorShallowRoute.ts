'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const SHALLOW_NAV_EVENT = 'vbiz-editor-shallow-nav'

/**
 * URL-only section switch for the vCard editor. The shell lives in `layout.tsx`,
 * so the section panel can swap without an RSC round trip or a remount.
 */
export function pushEditorPath(path: string) {
  if (typeof window === 'undefined') return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(SHALLOW_NAV_EVENT))
}

/**
 * Pathname that also reflects `pushEditorPath`. `usePathname()` picks up
 * `history.pushState` on its own, but the local override keeps the shell correct
 * on the same tick as the click.
 */
export function useEditorPathname(): string {
  const routerPathname = usePathname()
  const [shallowPathname, setShallowPathname] = useState<string | null>(null)
  const [prevRouterPathname, setPrevRouterPathname] = useState(routerPathname)

  if (routerPathname !== prevRouterPathname) {
    setPrevRouterPathname(routerPathname)
    setShallowPathname(null)
  }

  useEffect(() => {
    const sync = () => setShallowPathname(window.location.pathname)
    window.addEventListener('popstate', sync)
    window.addEventListener(SHALLOW_NAV_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(SHALLOW_NAV_EVENT, sync)
    }
  }, [])

  return shallowPathname ?? routerPathname
}
