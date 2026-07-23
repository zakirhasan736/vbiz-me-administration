import { CheckCircle2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export const DoneModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex w-full max-w-sm flex-col items-center rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <CheckCircle2 size={48} />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-zinc-100">{`You're all set!`}</h2>
            <p className="mb-6 text-zinc-400">Thank you for connecting.</p>

            <button
              onClick={onClose}
              className="w-full rounded-full bg-white py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
