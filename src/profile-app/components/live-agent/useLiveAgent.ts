'use client'

import { getGeminiApiKey } from '@/lib/gemini'
import { LIVE_AGENT_CONFIG } from '@/lib/liveAgent/config'
import { getLiveAgentInitialPromptForLanguage, getSelectedLanguageForLiveAgent } from '@/lib/liveAgent/languagePrompt'
import {
  buildLiveAgentSystemPrompt,
  DEFAULT_LIVE_AGENT_CARD,
  type LiveAgentCardData,
} from '@/profile-app/lib/liveAgentPrompt'
import { buildLiveAgentTools, handleLiveAgentToolCalls } from '@/profile-app/lib/liveAgentTools'
import { EndSensitivity, GoogleGenAI, LiveServerMessage, Modality, Session, StartSensitivity } from '@google/genai'
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

const MIC_INPUT_GAIN = 2.4
const USER_SPEECH_THRESHOLD = 0.01
const AGENT_SILENCE_RECOVERY_MS = 6500
const SESSION_WAKE_INTERVAL_MS = 30000
const NUDGE_COOLDOWN_MS = 9000

export const MISSING_API_KEY_ERROR =
  'Gemini API key is missing. Add GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY to .env and restart the dev server.'

/** Text must use sendClientContent — sendRealtimeInput only accepts audio/media blobs. */
function sendInitialGreetingSafe(session: Session, cardData: LiveAgentCardData) {
  const company = cardData.company?.trim() || 'vBiz Me'
  const lang = getSelectedLanguageForLiveAgent()
  const greetingPrompt = getLiveAgentInitialPromptForLanguage(lang, company)
  try {
    session.sendClientContent({
      turns: greetingPrompt,
      turnComplete: true,
    })
  } catch (e) {
    console.error('Could not send initial greeting:', e)
  }
}

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

function sendClientTurnSafe(session: Session, text: string) {
  try {
    session.sendClientContent({
      turns: text,
      turnComplete: true,
    })
  } catch {
    /* socket already closed */
  }
}

function detectSpeechLevel(inputData: Float32Array) {
  let peak = 0
  let sumSquares = 0
  for (let i = 0; i < inputData.length; i++) {
    const sample = inputData[i]
    const abs = Math.abs(sample)
    peak = Math.max(peak, abs)
    sumSquares += sample * sample
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, inputData.length))
  return Math.max(peak, rms * 3.5)
}

function setupMicProcessor(
  audioContext: AudioContext,
  micSource: MediaStreamAudioSourceNode,
  processorRef: RefObject<ScriptProcessorNode | null>,
  onPcmChunk: (inputData: Float32Array) => void
) {
  const processor = audioContext.createScriptProcessor(512, 1, 1)
  processorRef.current = processor
  // Route through silent gain so onaudioprocess runs without playing mic to speakers (echo).
  const inputGain = audioContext.createGain()
  inputGain.gain.value = MIC_INPUT_GAIN
  const silentGain = audioContext.createGain()
  silentGain.gain.value = 0
  micSource.connect(inputGain)
  inputGain.connect(processor)
  processor.connect(silentGain)
  silentGain.connect(audioContext.destination)
  processor.onaudioprocess = (e) => {
    onPcmChunk(e.inputBuffer.getChannelData(0))
  }
}

export type UseLiveAgentOptions = {
  cardData?: LiveAgentCardData
  /** Pre-built server prompt — skips client-side prompt assembly. */
  systemInstruction?: string
  readyToConnect?: boolean
}

export function useLiveAgent({
  cardData = DEFAULT_LIVE_AGENT_CARD,
  systemInstruction: systemInstructionProp,
  readyToConnect = false,
}: UseLiveAgentOptions) {
  const [panelDismissed, setPanelDismissed] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const apiKey = getGeminiApiKey()
  const canAutoOpen = Boolean(apiKey && readyToConnect)
  const isOpen = canAutoOpen && !panelDismissed

  const setIsOpen = useCallback(
    (action: SetStateAction<boolean>) => {
      setPanelDismissed((prev) => {
        const currentOpen = canAutoOpen && !prev
        const nextOpen = typeof action === 'function' ? action(currentOpen) : action
        return !nextOpen
      })
    },
    [canAutoOpen]
  )
  const systemInstruction = useMemo(
    () => systemInstructionProp ?? buildLiveAgentSystemPrompt(cardData),
    [systemInstructionProp, cardData]
  )
  const displayError = error ?? (apiKey ? null : MISSING_API_KEY_ERROR)

  const isMutedRef = useRef(false)
  const systemInstructionRef = useRef(systemInstruction)
  const cardDataRef = useRef(cardData)
  const sessionRef = useRef<Session | null>(null)
  const hasStartedRef = useRef(false)
  const isConnectedRef = useRef(false)
  const isConnectingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const canStreamAudioRef = useRef(false)
  const connectionGenRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const pcmContextRef = useRef<AudioContext | null>(null)
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const allowMicInputRef = useRef(false)
  const micFallbackTimerRef = useRef<number | null>(null)
  const agentSilenceTimerRef = useRef<number | null>(null)
  const sessionWakeTimerRef = useRef<number | null>(null)
  const scheduleSessionWakeRef = useRef<(() => void) | null>(null)
  const lastUserSpeechAtRef = useRef(0)
  const lastAgentAudioAtRef = useRef(0)
  const lastNudgeAtRef = useRef(0)
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const nextStartTimeRef = useRef<number>(0)
  const checkSpeakingRef = useRef<number>(0)

  useEffect(() => {
    systemInstructionRef.current = systemInstruction
  }, [systemInstruction])

  useEffect(() => {
    cardDataRef.current = cardData
  }, [cardData])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])

  useEffect(() => {
    isConnectingRef.current = isConnecting
  }, [isConnecting])

  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

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

  const clearMicFallbackTimer = useCallback(() => {
    if (micFallbackTimerRef.current) {
      clearTimeout(micFallbackTimerRef.current)
      micFallbackTimerRef.current = null
    }
  }, [])

  const clearAgentSilenceTimer = useCallback(() => {
    if (agentSilenceTimerRef.current) {
      clearTimeout(agentSilenceTimerRef.current)
      agentSilenceTimerRef.current = null
    }
  }, [])

  const clearSessionWakeTimer = useCallback(() => {
    if (sessionWakeTimerRef.current) {
      clearTimeout(sessionWakeTimerRef.current)
      sessionWakeTimerRef.current = null
    }
  }, [])

  const sendRecoveryNudge = useCallback((text: string) => {
    const session = sessionRef.current
    const now = Date.now()
    if (!session || !isConnectedRef.current || now - lastNudgeAtRef.current < NUDGE_COOLDOWN_MS) return
    lastNudgeAtRef.current = now
    sendClientTurnSafe(session, text)
  }, [])

  const scheduleAgentSilenceRecovery = useCallback(() => {
    clearAgentSilenceTimer()
    agentSilenceTimerRef.current = window.setTimeout(() => {
      agentSilenceTimerRef.current = null
      const now = Date.now()
      const heardRecently = now - lastUserSpeechAtRef.current < AGENT_SILENCE_RECOVERY_MS + 2500
      const agentHasAnswered = lastAgentAudioAtRef.current > lastUserSpeechAtRef.current
      if (!heardRecently || agentHasAnswered || isSpeakingRef.current || !allowMicInputRef.current) return

      sendRecoveryNudge(
        '[SYSTEM: The visitor just spoke and may be waiting for your reply. Respond now in 1-2 friendly sentences. If the speech was unclear, say you may have missed part of it and ask one simple clarifying question. Do not stay silent.]'
      )
    }, AGENT_SILENCE_RECOVERY_MS)
  }, [clearAgentSilenceTimer, sendRecoveryNudge])

  const scheduleSessionWake = useCallback(() => {
    clearSessionWakeTimer()
    sessionWakeTimerRef.current = window.setTimeout(() => {
      sessionWakeTimerRef.current = null
      if (!isConnectedRef.current || !allowMicInputRef.current) return

      const now = Date.now()
      const idleSinceUser = now - lastUserSpeechAtRef.current
      const idleSinceAgent = now - lastAgentAudioAtRef.current
      if (
        !isSpeakingRef.current &&
        idleSinceUser > SESSION_WAKE_INTERVAL_MS &&
        idleSinceAgent > SESSION_WAKE_INTERVAL_MS
      ) {
        sendRecoveryNudge(
          '[SYSTEM: Stay awake and ready. If the visitor seems to be waiting, briefly let them know you are still listening and they can answer in a normal voice. Keep it warm and concise.]'
        )
      }

      scheduleSessionWakeRef.current?.()
    }, SESSION_WAKE_INTERVAL_MS)
  }, [clearSessionWakeTimer, sendRecoveryNudge])

  useEffect(() => {
    scheduleSessionWakeRef.current = scheduleSessionWake
  }, [scheduleSessionWake])

  const disconnect = useCallback(() => {
    connectionGenRef.current += 1
    canStreamAudioRef.current = false
    allowMicInputRef.current = false
    micSourceRef.current = null
    clearMicFallbackTimer()
    clearAgentSilenceTimer()
    clearSessionWakeTimer()
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
  }, [clearAgentSilenceTimer, clearMicFallbackTimer, clearSessionWakeTimer, stopInputCapture])

  const endLiveSession = useCallback(
    (attemptGen: number) => {
      if (attemptGen !== connectionGenRef.current) return
      canStreamAudioRef.current = false
      clearAgentSilenceTimer()
      clearSessionWakeTimer()
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
    [clearAgentSilenceTimer, clearSessionWakeTimer, stopInputCapture]
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
    allowMicInputRef.current = false
    clearMicFallbackTimer()
    clearAgentSilenceTimer()
    clearSessionWakeTimer()
    lastUserSpeechAtRef.current = Date.now()
    lastAgentAudioAtRef.current = Date.now()
    lastNudgeAtRef.current = 0
    initAudioOutput()

    const attemptGen = ++connectionGenRef.current

    try {
      const ai = new GoogleGenAI({ apiKey: key })
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
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
      micSourceRef.current = micSource

      const connectWithModel = (model: string, gen: number) => {
        const beginMicCapture = (sessionPromise: Promise<Session>) => {
          if (processorRef.current || !allowMicInputRef.current) return
          setupMicProcessor(audioContext, micSource, processorRef, (inputData) => {
            if (!allowMicInputRef.current || !canStreamAudioRef.current || isMutedRef.current) return

            const speechLevel = detectSpeechLevel(inputData)
            if (speechLevel > USER_SPEECH_THRESHOLD) {
              const now = Date.now()
              if (now - lastUserSpeechAtRef.current > 350) {
                lastUserSpeechAtRef.current = now
                void audioContextRef.current?.resume()
                void pcmContextRef.current?.resume()
                scheduleAgentSilenceRecovery()
              }
            }

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
              return
            }

            void sessionPromise
              .then((s) => {
                if (allowMicInputRef.current && canStreamAudioRef.current) sendRealtimeInputSafe(s, payload)
              })
              .catch(() => {
                /* connection closed */
              })
          })
        }

        const sessionPromise = ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
                prefixPaddingMs: 80,
                silenceDurationMs: 900,
              },
            },
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_AGENT_CONFIG.voice } },
            },
            systemInstruction: systemInstructionRef.current,
            tools: buildLiveAgentTools(),
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
                  sendInitialGreetingSafe(session, cardDataRef.current)
                  // Fallback: enable mic if greeting turnComplete never arrives.
                  micFallbackTimerRef.current = window.setTimeout(() => {
                    if (gen !== connectionGenRef.current || allowMicInputRef.current) return
                    allowMicInputRef.current = true
                    beginMicCapture(sessionPromise)
                    scheduleSessionWake()
                  }, 8000)
                })
                .catch((e: unknown) => console.error('Could not get session:', e))
            },
            onmessage: (message: LiveServerMessage) => {
              if (gen !== connectionGenRef.current) return

              const functionCalls = message.toolCall?.functionCalls
              if (functionCalls?.length) {
                const session = sessionRef.current
                if (session) {
                  handleLiveAgentToolCalls(functionCalls, session, cardDataRef.current)
                }
              }

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
              if (base64Audio && pcmContextRef.current) {
                lastAgentAudioAtRef.current = Date.now()
                clearAgentSilenceTimer()
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

              // Enable mic only after the greeting turn finishes — avoids echo/self-interrupt.
              if (message.serverContent?.turnComplete && !allowMicInputRef.current) {
                allowMicInputRef.current = true
                if (micFallbackTimerRef.current) {
                  clearTimeout(micFallbackTimerRef.current)
                  micFallbackTimerRef.current = null
                }
                beginMicCapture(sessionPromise)
                scheduleSessionWake()
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
  }, [
    clearAgentSilenceTimer,
    clearMicFallbackTimer,
    clearSessionWakeTimer,
    disconnect,
    endLiveSession,
    scheduleAgentSilenceRecovery,
    scheduleSessionWake,
    setIsOpen,
    stopInputCapture,
  ])

  useEffect(() => {
    if (!apiKey || !readyToConnect) return

    return () => {
      hasStartedRef.current = false
      disconnect()
    }
  }, [apiKey, disconnect, readyToConnect])

  useEffect(() => {
    if (!apiKey || !readyToConnect) return
    if (hasStartedRef.current || isConnectedRef.current || isConnectingRef.current) return

    hasStartedRef.current = true
    void startConnection()
  }, [apiKey, readyToConnect, startConnection])

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
