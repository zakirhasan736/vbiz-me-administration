'use client'

import { CrmRecordingActiveBar } from '@/components/crm/CrmRecordingActiveBar'
import { useLiveMicWaveform, type MicWaveAccent } from '@/components/crm/useLiveMicWaveform'
import { AUDIO_RECORD_MAX_SECONDS, blobToRecordedFile, pickAudioRecorderMimeType } from '@/lib/media/mediaRecorderMime'
import { cn } from '@/utils/cn'
import { Loader2, Mic } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type CrmAudioRecorderProps = {
  disabled?: boolean
  busy?: boolean
  onRecorded: (file: File) => void | Promise<void>
  onRecordingChange?: (recording: boolean) => void
  className?: string
  startLabel?: string
  accent?: MicWaveAccent
}

export function CrmAudioRecorder({
  disabled = false,
  busy = false,
  onRecorded,
  onRecordingChange,
  className,
  startLabel = 'Start recording',
  accent = 'rose',
}: CrmAudioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [starting, setStarting] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const discardRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const accumulatedMsRef = useRef(0)
  const onRecordedRef = useRef(onRecorded)
  const onRecordingChangeRef = useRef(onRecordingChange)
  const waveformStartedRef = useRef(false)

  const { canvasRef, startWaveform, stopWaveform, setPaused: setWavePaused } = useLiveMicWaveform(accent)

  useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  useEffect(() => {
    onRecordingChangeRef.current = onRecordingChange
  }, [onRecordingChange])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const setRecordingState = useCallback((next: boolean) => {
    setRecording(next)
    onRecordingChangeRef.current?.(next)
  }, [])

  const readElapsedSeconds = useCallback(() => {
    if (paused) return Math.floor(accumulatedMsRef.current / 1000)
    return Math.floor((accumulatedMsRef.current + (Date.now() - startedAtRef.current)) / 1000)
  }, [paused])

  const cleanupRecording = useCallback(() => {
    clearTimer()
    stopWaveform()
    stopStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
    accumulatedMsRef.current = 0
    waveformStartedRef.current = false
    setElapsed(0)
    setPaused(false)
    setWavePaused(false)
    setFinalizing(false)
    setStarting(false)
  }, [clearTimer, setWavePaused, stopStream, stopWaveform])

  useEffect(() => {
    return () => {
      discardRef.current = true
      try {
        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop()
        }
      } catch {
        /* ignore */
      }
      cleanupRecording()
      setRecordingState(false)
    }
  }, [cleanupRecording, setRecordingState])

  useLayoutEffect(() => {
    if (!recording || finalizing || waveformStartedRef.current) return
    const stream = streamRef.current
    if (!stream) return
    waveformStartedRef.current = true
    void startWaveform(stream)
  }, [recording, finalizing, startWaveform])

  const finishAndEmit = useCallback(
    async (recorder: MediaRecorder) => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      chunksRef.current = []
      if (!blob.size) {
        setError('No audio captured. Try again.')
        cleanupRecording()
        setRecordingState(false)
        return
      }
      setFinalizing(true)
      try {
        const file = blobToRecordedFile(blob, 'audio')
        await onRecordedRef.current(file)
      } catch {
        setError('Couldn’t finish the recording upload.')
      } finally {
        cleanupRecording()
        setRecordingState(false)
      }
    },
    [cleanupRecording, setRecordingState]
  )

  const stopRecording = useCallback(
    (discard: boolean) => {
      discardRef.current = discard
      clearTimer()
      stopWaveform()
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        try {
          if (recorder.state === 'paused') {
            try {
              recorder.resume()
            } catch {
              /* ignore */
            }
          }
          recorder.stop()
        } catch {
          cleanupRecording()
          setRecordingState(false)
        }
      } else {
        cleanupRecording()
        setRecordingState(false)
      }
    },
    [cleanupRecording, clearTimer, setRecordingState, stopWaveform]
  )

  const togglePause = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || finalizing || busy) return

    if (recorder.state === 'recording') {
      if (typeof recorder.pause !== 'function') {
        setError('Pause is not supported in this browser.')
        return
      }
      try {
        accumulatedMsRef.current += Date.now() - startedAtRef.current
        recorder.pause()
        setPaused(true)
        setWavePaused(true)
        setElapsed(Math.floor(accumulatedMsRef.current / 1000))
      } catch {
        setError('Couldn’t pause the recording.')
      }
      return
    }

    if (recorder.state === 'paused') {
      try {
        recorder.resume()
        startedAtRef.current = Date.now()
        setPaused(false)
        setWavePaused(false)
      } catch {
        setError('Couldn’t resume the recording.')
      }
    }
  }, [busy, finalizing, setWavePaused])

  const startRecording = async () => {
    if (disabled || busy || recording || finalizing || starting) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not supported in this browser.')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Audio recording is not supported in this browser.')
      return
    }

    setError(null)
    setStarting(true)
    discardRef.current = false
    chunksRef.current = []
    accumulatedMsRef.current = 0
    waveformStartedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      const mimeType = pickAudioRecorderMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        stopStream()
        if (discardRef.current) {
          cleanupRecording()
          setRecordingState(false)
          return
        }
        void finishAndEmit(recorder)
      }

      mediaRecorderRef.current = recorder
      recorder.start(120)
      startedAtRef.current = Date.now()
      setElapsed(0)
      setPaused(false)
      setWavePaused(false)
      setStarting(false)
      setRecordingState(true)
    } catch {
      setError('Microphone permission is required to record audio.')
      cleanupRecording()
      setRecordingState(false)
    }
  }

  // Keep readElapsedSeconds current inside the interval without resetting the timer.
  const readElapsedSecondsRef = useRef(readElapsedSeconds)
  useEffect(() => {
    readElapsedSecondsRef.current = readElapsedSeconds
  }, [readElapsedSeconds])

  useEffect(() => {
    if (!recording || finalizing) return
    clearTimer()
    timerRef.current = setInterval(() => {
      const seconds = readElapsedSecondsRef.current()
      setElapsed(seconds)
      if (seconds >= AUDIO_RECORD_MAX_SECONDS) {
        stopRecording(false)
      }
    }, 250)
    return clearTimer
  }, [recording, finalizing, paused, clearTimer, stopRecording])

  const nearLimit = elapsed >= AUDIO_RECORD_MAX_SECONDS - 15

  if (recording || finalizing) {
    return (
      <div className={cn('space-y-2', className)}>
        <CrmRecordingActiveBar
          accent={accent}
          elapsed={elapsed}
          maxSeconds={AUDIO_RECORD_MAX_SECONDS}
          nearLimit={nearLimit}
          busy={finalizing}
          paused={paused}
          canvasRef={canvasRef}
          onStop={() => stopRecording(false)}
          onDiscard={() => stopRecording(true)}
          onPauseToggle={togglePause}
        />
        {error ? <p className="text-[11px] font-medium text-rose-600">{error}</p> : null}
      </div>
    )
  }

  const idleHover =
    accent === 'indigo'
      ? 'hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-800 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200'
      : 'hover:border-rose-300 hover:bg-rose-50/60 hover:text-rose-800 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-200'

  return (
    <div className={cn('space-y-1.5', className)}>
      <button
        type="button"
        disabled={disabled || busy || starting}
        onClick={() => void startRecording()}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
          idleHover
        )}
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {starting ? 'Starting…' : startLabel}
      </button>
      {error ? <p className="text-[11px] font-medium text-rose-600">{error}</p> : null}
    </div>
  )
}
