'use client'

import { CreateCardModeModal } from '@/components/vcard/create-agent/CreateCardModeModal'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

type CreateCardLauncherProps = {
  children: (open: () => void) => ReactNode
  canCreate?: boolean
  onBlocked?: () => void
  createHref?: string
  aiHref?: string
}

function withFreshReset(href: string) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const hasQuery = href.includes('?')
  const joiner = hasQuery ? '&' : '?'
  return `${href}${joiner}reset=${stamp}`
}

/** Wraps any create CTA with AI vs Manual mode selection. */
export function CreateCardLauncher({
  children,
  canCreate = true,
  onBlocked,
  createHref = '/vcards/create/home',
  aiHref = '/vcards/create/home?agent=1',
}: CreateCardLauncherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const launch = () => {
    if (!canCreate) {
      onBlocked?.()
      return
    }
    setOpen(true)
  }

  return (
    <>
      {children(launch)}
      <CreateCardModeModal
        open={open}
        onClose={() => setOpen(false)}
        onChooseManual={() => {
          setOpen(false)
          router.push(withFreshReset(createHref))
        }}
        onChooseAi={() => {
          setOpen(false)
          router.push(withFreshReset(aiHref))
        }}
      />
    </>
  )
}
