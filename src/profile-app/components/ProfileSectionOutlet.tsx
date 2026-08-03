'use client'

import type { HomeHeroProps, ProfileTemplateVariant } from '@/profile-app/sections'
import { ProfileNavSection } from '@/profile-app/sections'
import { AnimatePresence, motion } from 'motion/react'

export type { HomeHeroProps }

type Props = {
  sectionId: string
  template?: ProfileTemplateVariant
  homeHeroProps?: HomeHeroProps
}

/** Animated section pane — v2 only; v1/v3 shells already animate section transitions. */
export function ProfileSectionOutlet({ sectionId, template = 'v3', homeHeroProps }: Props) {
  const content = <ProfileNavSection tabId={sectionId} template={template} homeHeroProps={homeHeroProps} />

  if (template !== 'v2') {
    return (
      <div className="relative w-full" data-section-id={sectionId}>
        {content}
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sectionId}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full"
        data-section-id={sectionId}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}
