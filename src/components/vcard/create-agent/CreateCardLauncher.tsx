'use client'

import AssignCardOwnerModal from '@/components/admin/AssignCardOwnerModal'
import AssignPortfolioOwnerModal from '@/components/admin/AssignPortfolioOwnerModal'
import { CreateCardModeModal } from '@/components/vcard/create-agent/CreateCardModeModal'
import { useAccountStatus } from '@/hooks/useAccountStatus'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { ACCOUNT_PAUSED_CREATE_MESSAGE } from '@/lib/accountStatus'
import { clearCreateCardOwner, setCreateCardOwner, type CreateCardOwnerSession } from '@/lib/admin/createCardOwner'
import { notify } from '@/lib/toast/toast'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

type CreateCardLauncherProps = {
  children: (open: () => void) => ReactNode
  canCreate?: boolean
  onBlocked?: () => void
  createHref?: string
  aiHref?: string
  /** When true (admin directory create), require a client owner before Manual/AI. */
  requireOwnerAssignment?: boolean
  /** When true (My Cards), pick self or a team member before Manual/AI. */
  portfolioOwnerAssignment?: boolean
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
  portfolioOwnerAssignment = false,
}: CreateCardLauncherProps) {
  const router = useRouter()
  const { canMutateVcards } = useAccountStatus()
  const { allow_auto_card_builder: canUseAi } = usePackageAccess()
  const [assignOpen, setAssignOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const needsAssignment = requireOwnerAssignment || portfolioOwnerAssignment
  const allowed = canCreate && (requireOwnerAssignment || canMutateVcards)

  const launch = () => {
    if (!allowed) {
      if (!canMutateVcards && !requireOwnerAssignment) {
        notify.warning(ACCOUNT_PAUSED_CREATE_MESSAGE)
      }
      onBlocked?.()
      return
    }
    if (needsAssignment) {
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
      {portfolioOwnerAssignment ? (
        <AssignPortfolioOwnerModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          onConfirm={openModeAfterAssign}
        />
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
        canUseAi={canUseAi}
      />
    </>
  )
}
