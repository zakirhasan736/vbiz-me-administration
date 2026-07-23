'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { renderProfileNavContent } from '@/profile-app/lib/profileNavContent'
import { AnimatePresence, motion } from 'motion/react'

type Props = {
  sectionId: string
}

/** Animated section pane — only this subtree updates on nav / route changes. */
export function ProfileSectionOutlet({ sectionId }: Props) {
  const { design } = useProfileDisplay()
  const template = design?.profileTemplate === 'v1' ? 'v1' : 'v2'
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sectionId}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full"
      >
        {renderProfileNavContent(sectionId, { template })}
      </motion.div>
    </AnimatePresence>
  )
}
