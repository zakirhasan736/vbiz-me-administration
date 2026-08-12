'use client'

import AssignCardOwnerModal from '@/components/admin/AssignCardOwnerModal'
import { CreateCardModeModal } from '@/components/vcard/create-agent/CreateCardModeModal'
import { clearCreateCardOwner, setCreateCardOwner, type CreateCardOwnerSession } from '@/lib/admin/createCardOwner'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

type CreateCardLauncherProps = {
  children: (open: () => void) => ReactNode
  canCreate?: boolean
  onBlocked?: () => void
  createHref?: string
  aiHref?: string
  /** When true (admin directory create), require owner assignment before Manual/AI. */
  requireOwnerAssignment?: boolean
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
  requireOwnerAssignment = false,
}: CreateCardLauncherProps) {
  const router = useRouter()
  const [assignOpen, setAssignOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)

  const launch = () => {
    if (!canCreate) {
      onBlocked?.()
      return
    }
    if (requireOwnerAssignment) {
      setAssignOpen(true)
      return
    }
    clearCreateCardOwner()
    setModeOpen(true)
  }

  const openModeAfterAssign = (owner: CreateCardOwnerSession) => {
    setCreateCardOwner(owner)
    setAssignOpen(false)
    setModeOpen(true)
  }

  return (
    <>
      {children(launch)}
      {requireOwnerAssignment ? (
        <AssignCardOwnerModal open={assignOpen} onClose={() => setAssignOpen(false)} onConfirm={openModeAfterAssign} />
      ) : null}
      <CreateCardModeModal
        open={modeOpen}
        onClose={() => setModeOpen(false)}
        onChooseManual={() => {
          setModeOpen(false)
          router.push(withFreshReset(createHref))
        }}
        onChooseAi={() => {
          setModeOpen(false)
          router.push(withFreshReset(aiHref))
        }}
      />
    </>
  )
}
