'use client'

import type { ReactNode } from 'react'

type ProfileFloatingNavProps = {
  theme: 'light' | 'dark'
  children: ReactNode
}

/** Shared v1/v3 floating navbar chrome — scroll handled by Navigation (single overflow container). */
export function ProfileFloatingNav({ theme, children }: ProfileFloatingNavProps) {
  return (
    <div className="vbiz-floating-nav pointer-events-none fixed bottom-1 left-0 z-100 w-full px-2 md:top-5 md:bottom-auto md:px-20">
      <div
        className={`vbiz-floating-nav-inner pointer-events-auto relative mx-auto flex w-full max-w-[1032px] items-center rounded-[14px] border px-2 py-2 backdrop-blur-xl md:rounded-[20px] ${
          theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
        }`}
      >
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
