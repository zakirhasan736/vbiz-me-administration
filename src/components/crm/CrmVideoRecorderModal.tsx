'use client'

import { ModalPortal } from '@/components/ModalPortal'
import {
  VIDEO_RECORD_MAX_SECONDS,
  blobToRecordedFile,
  formatRecordingElapsed,
  pickVideoRecorderMimeType,
} from '@/lib/media/mediaRecorderMime'
import { cn } from '@/utils/cn'
import { Loader2, Square, Video, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export type CrmVideoRecorderModalProps = {
  open: boolean
  onClose: () => void
  onRecorded: (file: File) => void | Promise<void>
  uploading?: boolean
}

export function CrmVideoRecorderModal({ open, onClose, onRecorded, uploading = false }: CrmVideoRecorderModalProps) {
  const [previewReady, setPreviewReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [finalizing, setFinalizing] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const discardRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const onRecordedRef = useRef(onRecorded)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onRecordedRef.current = onRecorded
  }, [onRecorded])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const releaseMedia = useCallback(() => {
    try {
      if (mediaRecorderRef.current?.state === 'recording') {
        discardRef.current = true
        mediaRecorderRef.current.stop()
      }
    } catch {
      /* ignore */
    }
    clearTimer()
    stopStream()
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [clearTimer, stopStream])

  const resetLocalState = useCallback(() => {
    clearTimer()
    mediaRecorderRef.current = null
    chunksRef.current = []
    setRecording(false)
    setElapsed(0)
    setFinalizing(false)
    setPreviewReady(false)
  }, [clearTimer])

  const teardown = useCallback(() => {
    releaseMedia()
    resetLocalState()
  }, [releaseMedia, resetLocalState])

  // Reset UI when the modal closes — adjust during render to avoid setState-in-effect.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setRecording(false)
      setElapsed(0)
      setFinalizing(false)
      setPreviewReady(false)
      setError(null)
    }
  }

  const attachPreview = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    try {
      await video.play()
      setPreviewReady(true)
    } catch {
      setPreviewReady(true)
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera recording is not supported in this browser.')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Video recording is not supported in this browser.')
      return
    }

    setError(null)
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      }
      streamRef.current = stream
      await attachPreview(stream)
    } catch {
      setError('Camera and microphone permission are required to record video.')
      stopStream()
      setPreviewReady(false)
    }
  }, [attachPreview, stopStream])

  useEffect(() => {
    if (!open) {
      releaseMedia()
      return
    }
    // Defer so camera setup setState is not synchronous in the effect body.
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void startCamera()
    })
    return () => {
      cancelled = true
      releaseMedia()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open-driven lifecycle
  }, [open])

  const finishAndEmit = useCallback(
    async (recorder: MediaRecorder) => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      chunksRef.current = []
      if (!blob.size) {
        setError('No video captured. Try again.')
        setFinalizing(false)
        setRecording(false)
        return
      }
      setFinalizing(true)
      try {
        const file = blobToRecordedFile(blob, 'video')
        await onRecordedRef.current(file)
        stopStream()
        resetLocalState()
        onCloseRef.current()
      } catch {
        setError('Couldn’t finish the recording upload.')
        setFinalizing(false)
        setRecording(false)
      }
    },
    [resetLocalState, stopStream]
  )

  const stopRecording = useCallback(
    (discard: boolean) => {
      discardRef.current = discard
      clearTimer()
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          setRecording(false)
          if (discard) {
            /* keep preview alive after discard stop failure */
          }
        }
      } else {
        setRecording(false)
      }
    },
    [clearTimer]
  )

  const startRecording = () => {
    if (!streamRef.current || recording || finalizing || uploading) return
    setError(null)
    discardRef.current = false
    chunksRef.current = []

    const mimeType = pickVideoRecorderMimeType()
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      if (discardRef.current) {
        setRecording(false)
        setElapsed(0)
        clearTimer()
        chunksRef.current = []
        return
      }
      void finishAndEmit(recorder)
    }

    mediaRecorderRef.current = recorder
    recorder.start(250)
    startedAtRef.current = Date.now()
    setElapsed(0)
    setRecording(true)

    clearTimer()
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setElapsed(seconds)
      if (seconds >= VIDEO_RECORD_MAX_SECONDS) {
        stopRecording(false)
      }
    }, 250)
  }

  const handleClose = () => {
    if (finalizing || uploading) return
    discardRef.current = true
    teardown()
    onClose()
  }

  if (!open) return null

  const nearLimit = elapsed >= VIDEO_RECORD_MAX_SECONDS - 15
  const busy = finalizing || uploading

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-10050 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={handleClose} aria-hidden />
        <div className="animate-in zoom-in-95 relative flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-rose-700 uppercase dark:text-rose-300">
                <Video className="h-3.5 w-3.5" /> Record video
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Live preview</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Frame your shot, then start recording. Max {formatRecordingElapsed(VIDEO_RECORD_MAX_SECONDS)}.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
              aria-label="Close video recorder"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-white/10">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className={cn('h-full w-full scale-x-[-1] object-cover', !previewReady && 'opacity-0')}
              />
              {!previewReady && !error ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting camera…
                </div>
              ) : null}
              {recording ? (
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  Recording
                  <span
                    className={cn(
                      'font-mono tracking-normal normal-case tabular-nums',
                      nearLimit ? 'text-rose-300' : 'text-white'
                    )}
                  >
                    {formatRecordingElapsed(elapsed)}
                  </span>
                </div>
              ) : null}
            </div>

            {error ? <p className="text-[11px] font-medium text-rose-600">{error}</p> : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold tracking-wide text-slate-600 uppercase disabled:opacity-50 dark:border-white/10 dark:text-slate-300"
              >
                Cancel
              </button>
              {recording ? (
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  disabled={busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-semibold tracking-wide text-white uppercase disabled:opacity-50 dark:bg-rose-500"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5 fill-current" /> Stop & attach
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!previewReady || busy || Boolean(error)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-semibold tracking-wide text-white uppercase hover:bg-rose-500 disabled:opacity-50"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  Start recording
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
