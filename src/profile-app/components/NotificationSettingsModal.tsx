import { Bell, Save, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

const DEFAULT_PREFERENCES = ['contact', 'video', 'blog', 'company']

function readStoredPreferences(cardOwnerId: string): string[] {
  try {
    const pref = localStorage.getItem(`vbizme_notif_${cardOwnerId}`)
    if (!pref) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(pref)
    if (parsed.preferences) return parsed.preferences
  } catch {
    // ignore invalid stored data
  }
  return DEFAULT_PREFERENCES
}

const NotificationSettingsForm = ({ cardOwnerId, onClose }: { cardOwnerId: string; onClose: () => void }) => {
  const [preferences, setPreferences] = useState(() => readStoredPreferences(cardOwnerId))

  const togglePreference = (pref: string) => {
    setPreferences((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]))
  }

  const handleSave = () => {
    const pref = localStorage.getItem(`vbizme_notif_${cardOwnerId}`)
    const existing = pref ? JSON.parse(pref) : { asked: true, accepted: true }
    localStorage.setItem(`vbizme_notif_${cardOwnerId}`, JSON.stringify({ ...existing, preferences }))
    onClose()
  }

  return (
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

        <div className="flex flex-col text-left">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
              <Bell size={20} />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Notification Settings</h2>
          </div>

          <p className="mb-6 text-sm text-zinc-400">Choose what to get notified about:</p>

          <div className="mb-6 w-full space-y-3 rounded-xl bg-zinc-950/50 p-4 text-sm text-zinc-300">
            {[
              { id: 'contact', label: '📞 Updated contact info' },
              { id: 'video', label: '🎬 New videos or photos' },
              { id: 'blog', label: '📝 New blog posts' },
              { id: 'company', label: '🏢 Professional updates' },
            ].map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.includes(p.id)}
                  onChange={() => togglePreference(p.id)}
                  className="rounded border-zinc-700 bg-zinc-800 text-yellow-500 focus:ring-yellow-500"
                />
                {p.label}
              </label>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-200"
          >
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export const NotificationSettingsModal = ({
  isOpen,
  onClose,
  cardOwnerId = '91',
}: {
  isOpen: boolean
  onClose: () => void
  cardOwnerId?: string
}) => {
  return (
    <AnimatePresence>
      {isOpen && <NotificationSettingsForm key={cardOwnerId} cardOwnerId={cardOwnerId} onClose={onClose} />}
    </AnimatePresence>
  )
}
