'use client'

import { getGeminiApiKey } from '@/lib/gemini'
import { LIVE_AGENT_CONFIG } from '@/lib/liveAgent/config'
import {
  getLiveAgentInitialPromptForLanguage,
  getLiveAgentSystemPromptForLanguage,
  getSelectedLanguageForLiveAgent,
} from '@/lib/liveAgent/languagePrompt'
import { DEFAULT_LIVE_AGENT_CARD, type LiveAgentCardData } from '@/profile-app/lib/liveAgentPrompt'
import { openExternalIntent, toMailtoHref, toSmsHref, toTelHref } from '@/profile-app/lib/openExternalIntent'

import { buildLiveAgentToolConfig } from '@/lib/liveAgent/tools'
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai'
import { AlertCircle, Bot, Loader2, Mic, MicOff, Square, Volume2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

function scheduleSpeakingMonitor(
  pcmContextRef: RefObject<AudioContext | null>,
  nextStartTimeRef: RefObject<number>,
  checkSpeakingRef: RefObject<number>,
  setIsSpeaking: Dispatch<SetStateAction<boolean>>
) {
  const pcmContext = pcmContextRef.current
  const isCurrentlySpeaking = Boolean(pcmContext && pcmContext.currentTime < nextStartTimeRef.current - 0.05)
  setIsSpeaking((prev) => (prev === isCurrentlySpeaking ? prev : isCurrentlySpeaking))
  checkSpeakingRef.current = requestAnimationFrame(() =>
    scheduleSpeakingMonitor(pcmContextRef, nextStartTimeRef, checkSpeakingRef, setIsSpeaking)
  )
}

function sendInitialPromptSafe(session: Session, text: string) {
  try {
    session.sendClientContent({ turns: text, turnComplete: true })
  } catch (e) {
    console.error('Could not send initial prompt:', e)
  }
}

function sendRealtimeInputSafe(session: Session, payload: Parameters<Session['sendRealtimeInput']>[0]) {
  try {
    session.sendRealtimeInput(payload)
  } catch {
    /* socket already closed */
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'unknown'
}

export type LiveAgentPanelProps = {
  cardData?: LiveAgentCardData
  systemInstruction?: string
  readyToConnect?: boolean
  embedded?: boolean
  /** Card theme accent — falls back to `--vbiz-accent` on the profile root. */
  accentColor?: string
  /** Overrides the floating wrapper position classes (e.g. per-template placement). */
  wrapperClassName?: string
}

const DEFAULT_CARD = DEFAULT_LIVE_AGENT_CARD

/** Central live-agent UI panel — used by all templates via LiveAgent wrapper. */
export function LiveAgentPanel({
  cardData = DEFAULT_CARD,
  systemInstruction,
  readyToConnect = true,
  embedded = false,
  accentColor = 'var(--vbiz-accent, #ebd675)',
  wrapperClassName,
}: LiveAgentPanelProps) {
  const [panelDismissed, setPanelDismissed] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const apiKey = getGeminiApiKey()
  const ai = useMemo(() => (apiKey ? new GoogleGenAI({ apiKey }) : null), [apiKey])
  const canAutoOpen = Boolean(ai && readyToConnect)
  const isOpen = canAutoOpen ? !panelDismissed : manualOpen

  const setIsOpen = useCallback(
    (action: SetStateAction<boolean>) => {
      if (canAutoOpen) {
        setPanelDismissed((prev) => {
          const currentOpen = !prev
          const nextOpen = typeof action === 'function' ? action(currentOpen) : action
          return !nextOpen
        })
      } else {
        setManualOpen(action)
      }
    },
    [canAutoOpen]
  )

  const sessionRef = useRef<Session | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const pcmContextRef = useRef<AudioContext | null>(null)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const isCancelledRef = useRef<boolean>(false)
  const connectionTokenRef = useRef<number>(0)
  const hasStartedRef = useRef(false)

  const nextStartTimeRef = useRef<number>(0)
  const checkSpeakingRef = useRef<number>(0)
  const lastAudioTimeRef = useRef<number>(0)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const initAudioOutput = () => {
    if (!pcmContextRef.current) {
      pcmContextRef.current = new AudioContext({ sampleRate: 24000, latencyHint: 'interactive' })
      nextStartTimeRef.current = pcmContextRef.current.currentTime
    }
  }

  const playChunk = (audioBuffer: AudioBuffer) => {
    if (isMutedRef.current) return

    const pcmContext = pcmContextRef.current
    if (!pcmContext) return

    const source = pcmContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(pcmContext.destination)

    source.onended = () => {
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source)
    }
    scheduledSourcesRef.current.push(source)

    if (nextStartTimeRef.current < pcmContext.currentTime) {
      nextStartTimeRef.current = pcmContext.currentTime
    }
    source.start(nextStartTimeRef.current)
    nextStartTimeRef.current += audioBuffer.duration
    lastAudioTimeRef.current = Date.now() + Math.ceil(audioBuffer.duration * 1000)
  }

  const stopAgentSpeech = useCallback(() => {
    if (pcmContextRef.current) {
      scheduledSourcesRef.current.forEach((source) => {
        try {
          source.stop()
        } catch {
          /* already stopped */
        }
      })
      scheduledSourcesRef.current = []
      nextStartTimeRef.current = pcmContextRef.current.currentTime
      lastAudioTimeRef.current = 0
    }
    setIsSpeaking(false)
  }, [])

  const muteAndStopAgent = useCallback(() => {
    stopAgentSpeech()
    setIsMuted(true)
  }, [stopAgentSpeech])

  const unmuteAgent = useCallback(() => {
    setIsMuted(false)
  }, [])

  const disconnect = useCallback(() => {
    isCancelledRef.current = true
    connectionTokenRef.current++
    try {
      if (sessionRef.current) {
        sessionRef.current.close()
        sessionRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (processorRef.current) {
        processorRef.current.disconnect()
        processorRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (pcmContextRef.current) {
        pcmContextRef.current.close()
        pcmContextRef.current = null
      }
      if (checkSpeakingRef.current) {
        cancelAnimationFrame(checkSpeakingRef.current)
      }
    } catch (e) {
      console.error('Disconnect error', e)
    }

    setIsConnected(false)
    setIsConnecting(false)
    setIsSpeaking(false)
  }, [])

  const startConnection = useCallback(async () => {
    if (!ai) {
      setError('Gemini API key is missing. Add NEXT_PUBLIC_GEMINI_API_KEY to .env and restart the dev server.')
      return
    }
    const token = ++connectionTokenRef.current
    isCancelledRef.current = false

    // Soft/Clean disconnect prior runs or overlapping contexts
    try {
      if (sessionRef.current) {
        sessionRef.current.close()
        sessionRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (processorRef.current) {
        processorRef.current.disconnect()
        processorRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (pcmContextRef.current) {
        pcmContextRef.current.close()
        pcmContextRef.current = null
      }
      if (checkSpeakingRef.current) {
        cancelAnimationFrame(checkSpeakingRef.current)
      }
    } catch (e) {
      console.warn('Soft cleanup error:', e)
    }

    setIsConnecting(true)
    setIsConnected(false)
    setError(null)
    initAudioOutput()

    try {
      const selectedLang = getSelectedLanguageForLiveAgent()
      const company = cardData.company?.trim() || 'vBiz Me'

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (token !== connectionTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      mediaStreamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' })
      audioContextRef.current = audioContext

      // Need destination available
      await pcmContextRef.current?.resume()
      if (token !== connectionTokenRef.current) {
        audioContext.close()
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const source = audioContext.createMediaStreamSource(stream)
      const systemInstructionForLang = getLiveAgentSystemPromptForLanguage(selectedLang, cardData, systemInstruction)

      const sessionPromise = ai.live.connect({
        model: LIVE_AGENT_CONFIG.model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_AGENT_CONFIG.voice } },
          },
          systemInstruction: systemInstructionForLang,
          tools: buildLiveAgentToolConfig(),
        },
        callbacks: {
          onopen: () => {
            if (token !== connectionTokenRef.current) return
            setIsConnected(true)
            setIsConnecting(false)

            scheduleSpeakingMonitor(pcmContextRef, nextStartTimeRef, checkSpeakingRef, setIsSpeaking)

            const initialPromptForLang = getLiveAgentInitialPromptForLanguage(selectedLang, company)
            void sessionPromise
              .then((session: Session) => {
                if (token !== connectionTokenRef.current) {
                  session.close()
                  return
                }
                sendInitialPromptSafe(session, initialPromptForLang)
              })
              .catch((e: unknown) => console.error('Could not get session:', e))

            const processor = audioContext.createScriptProcessor(512, 1, 1)
            processorRef.current = processor
            source.connect(processor)
            processor.connect(audioContext.destination)

            processor.onaudioprocess = (e) => {
              // Acoustic Echo Cancellation: Do not listen or send mic input while the AI agent is actively speaking (playing audio)
              const isAgentSpeaking = Date.now() < lastAudioTimeRef.current + 300
              if (isMutedRef.current || isAgentSpeaking || token !== connectionTokenRef.current) return

              const inputData = e.inputBuffer.getChannelData(0)
              const pcm16 = new Int16Array(inputData.length)
              let hasAudio = false
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff
                if (Math.abs(pcm16[i]) > 0) hasAudio = true
              }

              if (!hasAudio) return // avoid sending empty buffers if possible

              const uint8 = new Uint8Array(pcm16.buffer)
              let binary = ''
              for (let i = 0; i < uint8.byteLength; i++) {
                binary += String.fromCharCode(uint8[i])
              }
              const base64Data = btoa(binary)

              const payload = {
                audio: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64Data,
                },
              }

              if (sessionRef.current) {
                sendRealtimeInputSafe(sessionRef.current, payload)
              } else {
                void sessionPromise
                  .then((session) => {
                    if (token !== connectionTokenRef.current) {
                      session.close()
                      return
                    }
                    sendRealtimeInputSafe(session, payload)
                  })
                  .catch((err: unknown) => {
                    console.error('Error sending input', err)
                  })
              }
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (token !== connectionTokenRef.current) return
            console.log('Live API Message', message)
            if (message.goAway) {
              console.warn('Received GoAway signal, closing session.')
              disconnect()
              return
            }

            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls
              if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                  const args = (call.args ?? {}) as Record<string, string>
                  let result =
                    'Opened the device app (or showed a Tap to open button). If nothing opened, ask them to tap the yellow Open button once. Do not say popup blocked unless they report that.'

                  if (call.name === 'callUser') {
                    const href = toTelHref(cardData.phone ?? '')
                    if (href) {
                      openExternalIntent(href, 'Call now', cardData.phone)
                    } else {
                      result = 'No phone number is available on this card.'
                    }
                  } else if (call.name === 'emailUser') {
                    const href = toMailtoHref(cardData.email ?? '', args.subject, args.body)
                    if (href) {
                      openExternalIntent(href, 'Open email', cardData.email)
                    } else {
                      result = 'No email address is available on this card.'
                    }
                  } else if (call.name === 'textUser') {
                    const href = toSmsHref(cardData.phone ?? '', args.body)
                    if (href) {
                      openExternalIntent(href, 'Open messages', cardData.phone)
                    } else {
                      result = 'No phone number is available on this card for SMS.'
                    }
                  } else if (call.name === 'openVideos') {
                    const query = args?.query || `${cardData.ownerName || 'intro'} videos`
                    openExternalIntent(
                      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
                      'Open videos',
                      query
                    )
                  } else if (call.name === 'saveContact') {
                    window.dispatchEvent(new CustomEvent(LIVE_AGENT_CONFIG.events.saveContact))
                    result = 'Save Contact popup opened.'
                  } else if (call.name === 'openNotepad') {
                    window.dispatchEvent(new CustomEvent(LIVE_AGENT_CONFIG.events.openNotepad))
                    result = 'Notepad opened.'
                  } else {
                    result = `Unknown action: ${call.name ?? 'unnamed'}`
                  }

                  if (sessionRef.current) {
                    sessionRef.current.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: call.name,
                          response: { result },
                        },
                      ],
                    })
                  }
                }
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
            if (base64Audio && pcmContextRef.current) {
              const binary = atob(base64Audio)
              const buffer = new ArrayBuffer(binary.length)
              const view = new Uint8Array(buffer)
              for (let i = 0; i < binary.length; i++) {
                view[i] = binary.charCodeAt(i)
              }
              const pcm16 = new Int16Array(buffer)

              const pcmContext = pcmContextRef.current
              const audioBuffer = pcmContext.createBuffer(1, pcm16.length, 24000)
              const channelData = audioBuffer.getChannelData(0)
              for (let i = 0; i < pcm16.length; i++) {
                channelData[i] = pcm16[i] / 0x7fff
              }

              playChunk(audioBuffer)
            }

            if (message.serverContent?.interrupted) {
              if (pcmContextRef.current) {
                scheduledSourcesRef.current.forEach((source) => {
                  try {
                    source.stop()
                  } catch {
                    /* already stopped */
                  }
                })
                scheduledSourcesRef.current = []
                nextStartTimeRef.current = pcmContextRef.current.currentTime
                lastAudioTimeRef.current = 0
              }
            }
          },
          onerror: (err: ErrorEvent) => {
            if (token !== connectionTokenRef.current) return
            const errDetails = err.message || 'unknown'
            console.error('Live API Error:', err, 'Details:', errDetails)
            setError(`Connection error: ${errDetails}`)
            disconnect()
          },
          onclose: () => {
            if (token !== connectionTokenRef.current) return
            disconnect()
          },
        },
      })

      const resolvedSession = await sessionPromise
      if (token !== connectionTokenRef.current) {
        resolvedSession.close()
        return
      }
      sessionRef.current = resolvedSession
    } catch (err: unknown) {
      if (token !== connectionTokenRef.current) return
      const message = getErrorMessage(err)
      console.error('Failed to start Live API', err, 'Details:', message)
      if (message.includes('Network error') && process.env.GEMINI_API_KEY === undefined) {
        console.warn('GEMINI_API_KEY is undefined at runtime.')
      }
      setError(message || 'Could not start voice session.')
      disconnect()
    }
  }, [ai, cardData, disconnect, systemInstruction])

  useEffect(() => {
    if (!readyToConnect || !ai) return
    return () => {
      hasStartedRef.current = false
      disconnect()
    }
  }, [readyToConnect, ai, disconnect])

  useEffect(() => {
    if (!readyToConnect || !ai) return
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    void startConnection()
  }, [readyToConnect, ai, startConnection])

  const toggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect()
    } else {
      startConnection()
    }
  }

  const toggleMuteOrStart = () => {
    if (!isConnected && !isConnecting) {
      unmuteAgent()
      void startConnection()
      return
    }
    if (isMuted) {
      unmuteAgent()
      return
    }
    muteAndStopAgent()
  }

  const showDesktopPanel = isOpen && !isMobile
  const fabLooksOpen = !isMobile && isOpen

  return (
    <motion.div
      drag
      dragMomentum={false}
      className={`${embedded ? 'absolute' : 'fixed'} live-ai-agent-panel pointer-events-none z-100 flex flex-col items-end gap-2 md:gap-4 ${
        wrapperClassName ??
        'top-1/2 right-3 -translate-y-1/2 md:top-auto md:right-6 md:bottom-6 md:translate-y-0 lg:right-10 lg:bottom-10'
      }`}
    >
      <AnimatePresence>
        {showDesktopPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="pointer-events-auto relative flex w-[260px] flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-sm backdrop-blur-xl md:w-72 md:gap-4 md:rounded-3xl md:p-5"
          >
            {isSpeaking && (
              <div
                className="pointer-events-none absolute inset-0 animate-pulse bg-linear-to-t via-transparent to-transparent opacity-50"
                style={{
                  background: `linear-gradient(to top, color-mix(in srgb, ${accentColor} 30%, transparent), transparent)`,
                }}
              />
            )}

            <div className="z-10 flex w-full items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors md:h-10 md:w-10 ${
                    isConnected ? 'vbiz-pill-icon' : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {isSpeaking ? (
                    <Volume2 className="h-4 w-4 animate-pulse md:h-[18px] md:w-[18px]" />
                  ) : (
                    <Bot className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wide text-zinc-100 md:text-sm">Live Agent</span>
                  <span className="text-[9px] tracking-widest text-zinc-500 uppercase md:text-[10px]">
                    {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="z-10 flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-400/10 p-2 text-[11px] text-red-400 md:text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="z-10 mt-1 flex items-center justify-center gap-2 md:mt-2 md:gap-3">
              {isConnected ? (
                <>
                  <button
                    onClick={() => {
                      if (isMuted) unmuteAgent()
                      else muteAndStopAgent()
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all md:h-12 md:w-12 ${isMuted ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  >
                    {isMuted ? (
                      <MicOff className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    ) : (
                      <Mic className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    )}
                  </button>
                  <button
                    onClick={toggleConnection}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-red-400 bg-red-500 text-white transition-all hover:bg-red-600 active:scale-95 md:h-16 md:w-16"
                  >
                    <Square className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleConnection}
                  disabled={isConnecting}
                  className="vbiz-live-agent-fab ml-auto flex h-12 w-12 items-center justify-center rounded-full shadow-sm transition-all hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-50 md:h-16 md:w-16"
                >
                  {isConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin md:h-6 md:w-6" />
                  ) : (
                    <Mic className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: small mic badge on agent button top-right; no popup */}
      <div className="pointer-events-auto relative">
        {isMobile && (isConnected || isConnecting || isMuted) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleMuteOrStart()
            }}
            disabled={isConnecting}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`absolute top-0 right-0 z-20 flex h-5 w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
              isMuted ? 'border-red-500/50 bg-red-500 text-white' : 'border-white/80 bg-zinc-950 text-zinc-100'
            }`}
          >
            {isConnecting ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : isMuted ? (
              <MicOff className="h-2.5 w-2.5" strokeWidth={2.5} />
            ) : (
              <Mic className="h-2.5 w-2.5" strokeWidth={2.5} />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              toggleMuteOrStart()
              return
            }
            setIsOpen(!isOpen)
          }}
          aria-label={
            isMobile
              ? isMuted
                ? 'Start live agent microphone'
                : 'Mute live agent microphone'
              : isOpen
                ? 'Close live agent panel'
                : 'Open live agent panel'
          }
          className={`relative flex items-center justify-center rounded-full border transition-all duration-300 ${
            fabLooksOpen
              ? 'h-10 w-10 border-zinc-800 bg-zinc-900 text-zinc-400 shadow-sm hover:bg-zinc-800 hover:text-zinc-200 md:h-14 md:w-14'
              : 'vbiz-live-agent-fab h-10 w-10 border-white shadow-sm hover:scale-105 active:scale-95 md:h-14 md:w-14'
          }`}
        >
          <Bot className="h-5 w-5 md:h-6 md:w-6" />
          {!isMobile && isConnected && !fabLooksOpen ? (
            <>
              <span className="vbiz-live-agent-dot absolute top-0 right-0 h-2.5 w-2.5 animate-ping rounded-full border-2 border-white md:h-3 md:w-3" />
              <span className="vbiz-live-agent-dot absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white md:h-3 md:w-3" />
            </>
          ) : null}
        </button>
      </div>
    </motion.div>
  )
}
