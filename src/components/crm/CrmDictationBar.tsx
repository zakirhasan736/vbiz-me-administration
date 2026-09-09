'use client'

import { CrmRecordingActiveBar } from '@/components/crm/CrmRecordingActiveBar'
import { useLiveMicWaveform } from '@/components/crm/useLiveMicWaveform'
import { cn } from '@/utils/cn'
import { Loader2, Mic } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult:
    | ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void)
    | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export type CrmDictationBarProps = {
  disabled?: boolean
  onTranscript: (chunk: string) => void
  onListeningChange?: (listening: boolean) => void
  onError?: (message: string) => void
  className?: string
  startLabel?: string
}

export function CrmDictationBar({
  disabled = false,
  onTranscript,
  onListeningChange,
  onError,
  className,
  startLabel = 'Start dictation',
}: CrmDictationBarProps) {
  const [listening, setListening] = useState(false)
  const [paused, setPaused] = useState(false)
  const [starting, setStarting] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const intentionalPauseRef = useRef(false)
  const waveformStartedRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const onListeningChangeRef = useRef(onListeningChange)
  const onErrorRef = useRef(onError)

  const { canvasRef, startWaveform, stopWaveform, setPaused: setWavePaused } = useLiveMicWaveform('indigo')

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    onListeningChangeRef.current = onListeningChange
  }, [onListeningChange])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const setListeningState = useCallback((next: boolean) => {
    setListening(next)
    onListeningChangeRef.current?.(next)
  }, [])

  const tearDownHardware = useCallback(() => {
    clearTimer()
    stopWaveform()
    stopStream()
    accumulatedMsRef.current = 0
    waveformStartedRef.current = false
    setElapsed(0)
    setPaused(false)
    setWavePaused(false)
  }, [clearTimer, setWavePaused, stopStream, stopWaveform])

  const stopRecognitionOnly = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.onend = null
        recognition.onerror = null
        recognition.onresult = null
        recognition.stop()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
  }, [])

  const bindRecognitionHandlers = useCallback(
    (recognition: SpeechRecognitionLike) => {
      recognition.onresult = (event) => {
        let finalChunk = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i]
          if (result?.isFinal) finalChunk += result[0]?.transcript || ''
        }
        const trimmed = finalChunk.trim()
        if (trimmed) onTranscriptRef.current(trimmed)
      }

      recognition.onerror = (event) => {
        if (intentionalPauseRef.current && (event.error === 'aborted' || event.error === 'no-speech')) {
          return
        }
        if (event.error === 'not-allowed') {
          onErrorRef.current?.('Microphone permission is required for voice to text.')
        } else if (event.error && event.error !== 'aborted') {
          onErrorRef.current?.('Speech recognition failed. Try again.')
        }
        recognitionRef.current = null
        tearDownHardware()
        setStarting(false)
        setListeningState(false)
      }

      recognition.onend = () => {
        recognitionRef.current = null
        if (intentionalPauseRef.current) {
          intentionalPauseRef.current = false
          return
        }
        tearDownHardware()
        setStarting(false)
        setListeningState(false)
      }
    },
    [setListeningState, tearDownHardware]
  )

  const stopListening = useCallback(() => {
    intentionalPauseRef.current = false
    stopRecognitionOnly()
    tearDownHardware()
    setStarting(false)
    setListeningState(false)
  }, [setListeningState, stopRecognitionOnly, tearDownHardware])

  useEffect(() => {
    return () => {
      intentionalPauseRef.current = false
      stopRecognitionOnly()
      tearDownHardware()
    }
  }, [stopRecognitionOnly, tearDownHardware])

  useLayoutEffect(() => {
    if (!listening || waveformStartedRef.current) return
    const stream = streamRef.current
    if (!stream) return
    waveformStartedRef.current = true
    void startWaveform(stream)
  }, [listening, startWaveform])

  const readElapsedSeconds = useCallback(() => {
    if (paused) return Math.floor(accumulatedMsRef.current / 1000)
    return Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
  }, [paused])

  const readElapsedSecondsRef = useRef(readElapsedSeconds)
  useEffect(() => {
    readElapsedSecondsRef.current = readElapsedSeconds
  }, [readElapsedSeconds])

  useEffect(() => {
    if (!listening) return
    clearTimer()
    timerRef.current = setInterval(() => {
      setElapsed(readElapsedSecondsRef.current())
    }, 250)
    return clearTimer
  }, [listening, paused, clearTimer])

  const togglePause = useCallback(() => {
    if (!listening || starting) return

    if (!paused) {
      intentionalPauseRef.current = true
      accumulatedMsRef.current += Date.now() - startedAtRef.current
      stopRecognitionOnly()
      setPaused(true)
      setWavePaused(true)
      setElapsed(Math.floor(accumulatedMsRef.current / 1000))
      return
    }

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      onErrorRef.current?.('Speech recognition is not supported in this browser.')
      return
    }

    try {
      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US'
      bindRecognitionHandlers(recognition)
      recognitionRef.current = recognition
      recognition.start()
      startedAtRef.current = Date.now()
      setPaused(false)
      setWavePaused(false)
    } catch {
      onErrorRef.current?.('Couldn’t resume dictation.')
    }
  }, [bindRecognitionHandlers, listening, paused, setWavePaused, starting, stopRecognitionOnly])

  const startListening = async () => {
    if (disabled || listening || starting) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      onErrorRef.current?.('Speech recognition is not supported in this browser.')
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current?.('Microphone access is not supported in this browser.')
      return
    }

    setStarting(true)
    intentionalPauseRef.current = false
    stopRecognitionOnly()
    tearDownHardware()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US'
      bindRecognitionHandlers(recognition)

      recognitionRef.current = recognition
      recognition.start()
      startedAtRef.current = Date.now()
      accumulatedMsRef.current = 0
      setElapsed(0)
      setPaused(false)
      setWavePaused(false)
      setStarting(false)
      setListeningState(true)
    } catch {
      onErrorRef.current?.('Microphone permission is required for voice to text.')
      tearDownHardware()
      setStarting(false)
      setListeningState(false)
    }
  }

  if (listening) {
    return (
      <div className={cn('space-y-2', className)}>
        <CrmRecordingActiveBar
          accent="indigo"
          elapsed={elapsed}
          paused={paused}
          canvasRef={canvasRef}
          onStop={stopListening}
          onPauseToggle={togglePause}
          stopLabel="Stop"
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <button
        type="button"
        disabled={disabled || starting}
        onClick={() => void startListening()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-800 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {starting ? 'Starting…' : startLabel}
      </button>
    </div>
  )
}
