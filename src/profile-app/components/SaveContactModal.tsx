import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { db } from '../lib/firebase'
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils'

export const SaveContactModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' })
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const path = 'contacts'
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp(),
      })
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setFormData({ firstName: '', lastName: '', email: '' })
        if (onSuccess) {
          onSuccess()
        } else {
          onClose()
        }
      }, 1000)
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contacts')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950 shadow-xl"
          >
            <div className="relative z-10 p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 rounded-full border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 focus:outline-none"
              >
                <X size={16} />
              </button>

              {!showSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-100">Save Contact</h3>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-bold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-[0.98]"
                  >
                    Save Contact
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-green-500"
                  >
                    <Check size={36} strokeWidth={3} />
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-zinc-100">Saved!</h3>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
