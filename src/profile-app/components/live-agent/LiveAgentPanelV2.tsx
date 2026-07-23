'use client'

import type { LiveAgentController } from '@/profile-app/components/live-agent/useLiveAgent'
import { AlertCircle, Bot, Loader2, Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

type LiveAgentPanelV2Props = LiveAgentController & {
  embedded?: boolean
}

/** Link-in-bio template UI — zinc floating panel from profile v2. */
export function LiveAgentPanelV2({
  isOpen,
  setIsOpen,
  isConnected,
  isConnecting,
  isSpeaking,
  isMuted,
  setIsMuted,
  displayError,
  toggleConnection,
  embedded = false,
}: LiveAgentPanelV2Props) {
  const shellClass = embedded
    ? 'vbiz-live-agent pointer-events-none relative flex flex-col items-end gap-3'
    : 'vbiz-live-agent pointer-events-none fixed right-6 bottom-6 z-100 flex flex-col items-end gap-4 lg:right-10 lg:bottom-10'

  return (
    <motion.div drag={!embedded} dragMomentum={false} className={shellClass}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`pointer-events-auto relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-sm backdrop-blur-xl ${embedded ? 'w-[min(17rem,100%)]' : 'w-72'}`}
          >
            {isSpeaking && (
              <div className="pointer-events-none absolute inset-0 animate-pulse bg-linear-to-t from-zinc-800/30 via-transparent to-transparent opacity-50" />
            )}

            <div className="z-10 flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isConnected ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-500'}`}
                >
                  {isSpeaking ? <Volume2 size={18} className="animate-pulse" /> : <Bot size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wide text-zinc-100">Live Agent</span>
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
                    {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {displayError && (
              <div className="z-10 flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-400/10 p-2 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <div className="z-10 mt-2 flex items-center justify-center gap-3">
              {isConnected ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${isMuted ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleConnection}
                    className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400 bg-red-500 text-white transition-all hover:bg-red-600 active:scale-95"
                    aria-label="End voice session"
                  >
                    <Square size={20} fill="currentColor" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={toggleConnection}
                  disabled={isConnecting}
                  className="ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-sm transition-all hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-50"
                  aria-label="Start voice session"
                >
                  {isConnecting ? (
                    <Loader2 size={24} className="animate-spin text-zinc-500" />
                  ) : (
                    <Mic size={24} strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto relative flex items-center justify-center rounded-full border transition-all duration-300 ${
          embedded ? 'h-12 w-12' : 'h-14 w-14'
        } ${
          isOpen
            ? 'border-zinc-800 bg-zinc-900 text-zinc-400 shadow-sm hover:bg-zinc-800 hover:text-zinc-200'
            : 'border-white bg-zinc-100 text-zinc-950 shadow-sm hover:scale-105 active:scale-95'
        }`}
        aria-label={isOpen ? 'Minimize live agent' : 'Open live agent'}
      >
        <Bot size={24} />
        {isConnected && !isOpen && (
          <>
            <span className="absolute top-0 right-0 h-3 w-3 animate-ping rounded-full border-2 border-zinc-900 bg-zinc-400" />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-zinc-400" />
          </>
        )}
      </button>
    </motion.div>
  )
}
