import { Wallet, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export const SaveToWalletModal = ({
  isOpen,
  onClose,
  onAction,
}: {
  isOpen: boolean
  onClose: () => void
  onAction: (saved: boolean) => void
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <Wallet size={32} />
              </div>

              <h2 className="mb-2 text-xl font-bold text-zinc-100">Save to Apple/Google Wallet?</h2>
              <p className="mb-8 text-sm text-zinc-400">
                {` Access Michaelangelo C.'s contact details instantly, even offline.`}
              </p>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={() => onAction(true)}
                  className="w-full rounded-full bg-white py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200"
                >
                  Yes, Save to Wallet
                </button>
                <button
                  onClick={() => onAction(false)}
                  className="w-full rounded-full bg-zinc-800 py-3 text-sm font-medium text-zinc-300 transition-all hover:text-white"
                >
                  No Thanks
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
