'use client'

import type { LiveAgentController } from '@/profile-app/components/live-agent/useLiveAgent'
import { AlertCircle, Bot, Loader2, Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

type LiveAgentPanelV1Props = LiveAgentController & {
  accentColor?: string
  embedded?: boolean
}

/** Classic template UI — gold concierge panel from profile v1. */
export function LiveAgentPanelV1({
  cardData,
  isOpen,
  setIsOpen,
  isConnected,
  isConnecting,
  isSpeaking,
  isMuted,
  setIsMuted,
  displayError,
  startConnection,
  disconnect,
  accentColor = '#ebd675',
  embedded = false,
}: LiveAgentPanelV1Props) {
  const ownerFirst = cardData.ownerName.split(' ')[0] || cardData.ownerName

  const shellClass = embedded
    ? 'vbiz-live-agent pointer-events-none relative flex flex-col items-end gap-3'
    : 'vbiz-live-agent pointer-events-none fixed right-6 bottom-6 z-100 flex flex-col items-end gap-4 lg:right-10 lg:bottom-10'

  return (
    <motion.div
      drag={!embedded}
      dragMomentum={false}
      dragConstraints={embedded ? undefined : { left: -1000, right: 50, top: -1000, bottom: 50 }}
      className={shellClass}
    >
      {!isOpen && (
        <motion.button
          type="button"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className={`pointer-events-auto relative flex items-center justify-center overflow-hidden rounded-full text-black shadow-[0_10px_40px_rgba(250,204,21,0.4)] ${embedded ? 'h-12 w-12' : 'h-16 w-16'}`}
          style={{ backgroundColor: accentColor }}
          aria-label="Open vBiz Concierge"
        >
          <div className="absolute inset-0 translate-x-full skew-x-12 bg-black/20 transition-transform duration-500 group-hover:translate-x-0 dark:bg-white/20" />
          <Bot size={embedded ? 22 : 28} className="relative z-10" />
          {isConnected && (
            <span className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-white bg-red-500" />
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
            className={`pointer-events-auto relative flex max-w-[min(18rem,calc(100cqi-1rem))] flex-col gap-4 overflow-hidden rounded-3xl border border-black/5 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 backdrop-blur-3xl dark:border-white/10 dark:bg-[#111]/90 dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] dark:ring-white/5 ${embedded ? 'w-[min(17rem,100%)] p-4' : 'w-72'}`}
          >
            {isSpeaking && (
              <div
                className="pointer-events-none absolute inset-0 animate-pulse opacity-50"
                style={{
                  background: `linear-gradient(to top, color-mix(in srgb, ${accentColor} 20%, transparent), transparent)`,
                }}
              />
            )}

            <div className="z-10 flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isConnected ? '' : 'bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-white/50'}`}
                  style={
                    isConnected
                      ? {
                          backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                          color: accentColor,
                        }
                      : undefined
                  }
                >
                  {isConnected ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Volume2 size={20} />
                    </motion.div>
                  ) : isConnecting ? (
                    <Loader2 size={20} className="animate-spin" style={{ color: accentColor }} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">vBiz Concierge</h4>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-gray-400'}`}
                    />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {isConnected ? 'Active Now' : isConnecting ? 'Connecting...' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                aria-label="Minimize concierge"
              >
                <Square size={16} />
              </button>
            </div>

            {displayError ? (
              <div className="z-10 rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/50 dark:bg-red-900/20">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                <p className="mb-3 text-xs text-red-600 dark:text-red-400">{displayError}</p>
                <button
                  type="button"
                  onClick={() => void startConnection()}
                  className="text-[10px] font-bold tracking-widest text-red-700 uppercase hover:underline dark:text-red-300"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="z-10 flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-black/5 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
                {!isConnected && !isConnecting ? (
                  <div className="text-center">
                    <p className="mb-4 px-2 text-xs text-gray-600 dark:text-gray-400">
                      Connect with our AI to learn more about {ownerFirst}&apos;s services.
                    </p>
                    <button
                      type="button"
                      onClick={() => void startConnection()}
                      className="rounded-full px-6 py-2 text-xs font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 10px 30px color-mix(in srgb, ${accentColor} 25%, transparent)`,
                      }}
                    >
                      Connect Voice
                    </button>
                  </div>
                ) : isConnected ? (
                  <div className="flex w-full flex-col items-center gap-3">
                    <div className="flex h-8 items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isSpeaking ? [8, 24, 8] : 8 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.5,
                            delay: i * 0.1,
                          }}
                          className="w-1 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                      ))}
                    </div>
                    <p className="animate-pulse text-xs text-gray-600 dark:text-gray-400">Listening...</p>
                    <div className="mt-2 flex w-full items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className={`rounded-full p-3 transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400'}`}
                        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <button
                        type="button"
                        onClick={disconnect}
                        className="rounded-full bg-red-500/10 p-3 text-red-500 transition-all hover:bg-red-500 hover:text-white"
                        aria-label="End voice session"
                      >
                        <Square size={20} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin" style={{ color: accentColor }} />
                    <p className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">
                      Authenticating...
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="z-10 text-center text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase dark:text-gray-600">
              Powered by vBiz AI Live
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
