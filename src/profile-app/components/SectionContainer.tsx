import { motion } from 'motion/react'
import { ReactNode } from 'react'

export const SectionContainer = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={`flex min-h-full w-full flex-col ${className}`}
  >
    <div className="relative flex h-full w-full flex-col">
      <div className="flex w-full flex-1 flex-col justify-start">{children}</div>
    </div>
  </motion.div>
)
