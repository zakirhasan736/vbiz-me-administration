'use client'

import { getGeminiApiKey } from '@/lib/gemini'
import {
  buildLiveAgentSystemPrompt,
  DEFAULT_LIVE_AGENT_CARD,
  type LiveAgentCardData,
} from '@/profile-app/lib/liveAgentPrompt'
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai'
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

/** Primary model matches working Vite reference; fallbacks if Google renames endpoints. */
const LIVE_MODEL_CANDIDATES = [
  'gemini-3.1-flash-live-preview',
  'gemini-live-2.5-flash-preview',
  'gemini-2.0-flash-live-preview-04-09',
] as const

export const MISSING_API_KEY_ERROR =
  'Gemini API key is missing. Add GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY to .env and restart the dev server.'

const INITIAL_GREETING_PROMPT =
  "The user has just opened the site. Please say: 'Welcome to vBiz Me! How can I help you?' and offer a quick guided tour of the card."

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

function sendRealtimeInputSafe(session: Session, payload: Parameters<Session['sendRealtimeInput']>[0]) {
  try {
    session.sendRealtimeInput(payload)
  } catch {
    /* socket already closed */
  }
}

/** Text must use sendClientContent — sendRealtimeInput only accepts audio/media blobs. */
function sendInitialGreetingSafe(session: Session) {
  try {
    session.sendClientContent({ turns: INITIAL_GREETING_PROMPT })
  } catch (e) {
    console.error('Could not send initial greeting:', e)
  }
}

function setupMicProcessor(
  audioContext: AudioContext,
  micSource: MediaStreamAudioSourceNode,
  processorRef: RefObject<ScriptProcessorNode | null>,
  onPcmChunk: (inputData: Float32Array) => void
) {
  const processor = audioContext.createScriptProcessor(512, 1, 1)
  processorRef.current = processor
  micSource.connect(processor)
  processor.connect(audioContext.destination)
  processor.onaudioprocess = (e) => {
    onPcmChunk(e.inputBuffer.getChannelData(0))
  }
}

export type UseLiveAgentOptions = {
  cardData?: LiveAgentCardData
  readyToConnect?: boolean
}

export function useLiveAgent({ cardData = DEFAULT_LIVE_AGENT_CARD, readyToConnect = false }: UseLiveAgentOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const apiKey = getGeminiApiKey()
  const systemInstruction = useMemo(() => buildLiveAgentSystemPrompt(cardData), [cardData])
  const displayError = error ?? (apiKey ? null : MISSING_API_KEY_ERROR)

  const isMutedRef = useRef(false)
  const systemInstructionRef = useRef(systemInstruction)
  const sessionRef = useRef<Session | null>(null)
  const hasStartedRef = useRef(false)
  const isConnectedRef = useRef(false)
  const isConnectingRef = useRef(false)
  const canStreamAudioRef = useRef(false)
  const connectionGenRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const pcmContextRef = useRef<AudioContext | null>(null)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const nextStartTimeRef = useRef<number>(0)
  const checkSpeakingRef = useRef<number>(0)

  useEffect(() => {
    systemInstructionRef.current = systemInstruction
  }, [systemInstruction])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    isConnectingRef.current = isConnecting
  }, [isConnecting])

  const initAudioOutput = () => {
    if (!pcmContextRef.current) {
      pcmContextRef.current = new AudioContext({ sampleRate: 24000, latencyHint: 'interactive' })
      nextStartTimeRef.current = pcmContextRef.current.currentTime
    }
  }

  const playChunk = (audioBuffer: AudioBuffer) => {
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
  }

  const stopInputCapture = useCallback(() => {
    canStreamAudioRef.current = false
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null
      processorRef.current.disconnect()
      processorRef.current = null
    }
  }, [])

  const disconnect = useCallback(() => {
    connectionGenRef.current += 1
    canStreamAudioRef.current = false
    stopInputCapture()

    try {
      if (sessionRef.current) {
        sessionRef.current.close()
        sessionRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (pcmContextRef.current) {
        void pcmContextRef.current.close()
        pcmContextRef.current = null
      }
      if (checkSpeakingRef.current) {
        cancelAnimationFrame(checkSpeakingRef.current)
        checkSpeakingRef.current = 0
      }
      scheduledSourcesRef.current = []
    } catch (e) {
      console.error('Disconnect error', e)
    }

    setIsConnected(false)
    setIsConnecting(false)
    setIsSpeaking(false)
  }, [stopInputCapture])

  const endLiveSession = useCallback(
    (attemptGen: number) => {
      if (attemptGen !== connectionGenRef.current) return
      canStreamAudioRef.current = false
      stopInputCapture()
      if (sessionRef.current) {
        try {
          sessionRef.current.close()
        } catch {
          /* already closed */
        }
        sessionRef.current = null
      }
      setIsConnected(false)
    },
    [stopInputCapture]
  )

  const startConnection = useCallback(async () => {
    if (isConnectedRef.current || isConnectingRef.current) return

    const key = getGeminiApiKey()
    if (!key) {
      setError(MISSING_API_KEY_ERROR)
      return
    }

    stopInputCapture()
    if (sessionRef.current) {
      try {
        sessionRef.current.close()
      } catch {
        /* already closed */
      }
      sessionRef.current = null
    }

    setIsConnecting(true)
    setIsConnected(false)
    setError(null)
    initAudioOutput()

    const attemptGen = ++connectionGenRef.current

    try {
      const ai = new GoogleGenAI({ apiKey: key })
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (attemptGen !== connectionGenRef.current) return

      mediaStreamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' })
      audioContextRef.current = audioContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      if (pcmContextRef.current?.state === 'suspended') {
        await pcmContextRef.current.resume()
      }

      const micSource = audioContext.createMediaStreamSource(stream)

      const connectWithModel = (model: string, gen: number) => {
        const sessionPromise = ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstructionRef.current,
          },
          callbacks: {
            onopen: () => {
              if (gen !== connectionGenRef.current) return

              setIsConnected(true)
              setIsConnecting(false)
              canStreamAudioRef.current = true
              scheduleSpeakingMonitor(pcmContextRef, nextStartTimeRef, checkSpeakingRef, setIsSpeaking)

              void sessionPromise
                .then((session: Session) => {
                  if (gen !== connectionGenRef.current || !canStreamAudioRef.current) return
                  sessionRef.current = session
                  sendInitialGreetingSafe(session)
                })
                .catch((e: unknown) => console.error('Could not get session:', e))

              stopInputCapture()
              setupMicProcessor(audioContext, micSource, processorRef, (inputData) => {
                if (!canStreamAudioRef.current || isMutedRef.current) return

                const pcm16 = new Int16Array(inputData.length)
                let hasAudio = false
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff
                  if (Math.abs(pcm16[i]) > 0) hasAudio = true
                }

                if (!hasAudio) return

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

                const session = sessionRef.current
                if (session) {
                  sendRealtimeInputSafe(session, payload)
                } else {
                  void sessionPromise
                    .then((s) => {
                      if (canStreamAudioRef.current) sendRealtimeInputSafe(s, payload)
                    })
                    .catch(() => {
                      /* connection closed */
                    })
                }
              })
            },
            onmessage: (message: LiveServerMessage) => {
              if (gen !== connectionGenRef.current) return

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
              if (base64Audio && pcmContextRef.current) {
                if (pcmContextRef.current.state === 'suspended') {
                  void pcmContextRef.current.resume()
                }
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
                }
              }
            },
            onerror: (err: ErrorEvent) => {
              if (gen !== connectionGenRef.current) return
              const errDetails = err.message || 'unknown'
              console.error('Live API Error:', err, 'Details:', errDetails)
              setError(`Connection error: ${errDetails}`)
              disconnect()
            },
            onclose: (event: CloseEvent) => {
              if (gen !== connectionGenRef.current) return
              if (isConnectedRef.current) {
                const reason = event.reason?.trim()
                setError(
                  reason
                    ? `Live session ended (${reason}). Tap the mic to reconnect.`
                    : 'Live session ended. Tap the mic to reconnect.'
                )
              }
              endLiveSession(gen)
            },
          },
        })

        return sessionPromise
      }

      let lastError: unknown
      for (const model of LIVE_MODEL_CANDIDATES) {
        if (attemptGen !== connectionGenRef.current) return

        try {
          const session = await connectWithModel(model, attemptGen)
          if (attemptGen !== connectionGenRef.current) {
            try {
              session.close()
            } catch {
              /* stale attempt */
            }
            return
          }
          sessionRef.current = session
          return
        } catch (modelErr) {
          lastError = modelErr
          console.warn(`Live model "${model}" failed:`, modelErr)
          endLiveSession(attemptGen)
        }
      }

      throw lastError ?? new Error('Could not connect to any Live API model.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not start voice session.'
      console.error('Failed to start Live API', err)

      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Microphone access is required for the Live Agent. Allow the mic, then tap the bot to retry.')
      } else if (!getGeminiApiKey()) {
        setError(MISSING_API_KEY_ERROR)
      } else {
        setError(message)
      }
      hasStartedRef.current = false
      disconnect()
      setIsOpen(true)
    }
  }, [disconnect, endLiveSession, stopInputCapture])

  useEffect(() => {
    if (!apiKey || !readyToConnect || hasStartedRef.current) return

    hasStartedRef.current = true
    setIsOpen(true)
    void startConnection()

    return () => {
      hasStartedRef.current = false
      disconnect()
    }
  }, [apiKey, disconnect, readyToConnect, startConnection])

  const toggleConnection = useCallback(() => {
    if (isConnectedRef.current || isConnectingRef.current) {
      disconnect()
      hasStartedRef.current = false
    } else {
      hasStartedRef.current = true
      void startConnection()
    }
  }, [disconnect, startConnection])

  return {
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
    toggleConnection,
  }
}

export type LiveAgentController = ReturnType<typeof useLiveAgent>
