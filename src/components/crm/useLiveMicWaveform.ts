'use client'

import { useCallback, useEffect, useRef } from 'react'

export type MicWaveAccent = 'rose' | 'indigo'

const ACCENT_RGB: Record<MicWaveAccent, string> = {
  rose: '244, 63, 94',
  indigo: '99, 102, 241',
}

const LEVEL_GAIN = 3.4
const SAMPLE_EVERY_MS = 45

export function useLiveMicWaveform(accent: MicWaveAccent = 'rose') {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const accentRef = useRef(accent)
  const streamRef = useRef<MediaStream | null>(null)
  const drawingRef = useRef(false)
  const pausedRef = useRef(false)
  const historyRef = useRef<number[]>([])
  const lastSampleAtRef = useRef(0)
  const timeDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    accentRef.current = accent
  }, [accent])

  const cancelRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const stopWaveform = useCallback(() => {
    cancelRaf()
    drawingRef.current = false
    pausedRef.current = false
    historyRef.current = []
    lastSampleAtRef.current = 0
    timeDataRef.current = null
    try {
      sourceRef.current?.disconnect()
    } catch {
      /* ignore */
    }
    sourceRef.current = null
    analyserRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    streamRef.current = null
  }, [cancelRaf])

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused
  }, [])

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return false

    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    cancelRaf()
    drawingRef.current = true
    timeDataRef.current = new Uint8Array(analyser.fftSize)
    lastSampleAtRef.current = performance.now()

    const resizeCanvas = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const cssWidth = Math.max(1, canvas.clientWidth || 320)
      const cssHeight = Math.max(1, canvas.clientHeight || 36)
      const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr))
      const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      return { dpr, cssWidth }
    }

    const sampleLevel = () => {
      const activeAnalyser = analyserRef.current
      const data = timeDataRef.current
      if (!activeAnalyser || !data) return 0
      activeAnalyser.getByteTimeDomainData(data)
      let peak = 0
      for (let i = 0; i < data.length; i += 1) {
        peak = Math.max(peak, Math.abs((data[i] ?? 128) - 128))
      }
      return Math.min(1, (peak / 128) * LEVEL_GAIN)
    }

    const render = () => {
      if (!drawingRef.current) return
      const activeCanvas = canvasRef.current
      if (!activeCanvas) return
      const activeCtx = activeCanvas.getContext('2d')
      if (!activeCtx) return

      const { dpr } = resizeCanvas()
      const now = performance.now()

      if (!pausedRef.current && now - lastSampleAtRef.current >= SAMPLE_EVERY_MS) {
        lastSampleAtRef.current = now
        historyRef.current.push(sampleLevel())
      }

      const { width, height } = activeCanvas
      activeCtx.clearRect(0, 0, width, height)

      const barWidth = 2.5 * dpr
      const gap = 2.25 * dpr
      const step = barWidth + gap
      const maxBars = Math.max(8, Math.floor((width + gap) / step))
      while (historyRef.current.length > maxBars) {
        historyRef.current.shift()
      }

      const history = historyRef.current
      const emptyCount = Math.max(0, maxBars - history.length)
      const isDark = document.documentElement.classList.contains('dark')
      const barRgb = isDark ? '226, 232, 240' : '71, 85, 105'
      const accentRgb = ACCENT_RGB[accentRef.current]
      const midY = height / 2

      // Dotted baseline for the unfilled (left) portion — WhatsApp-style.
      for (let i = 0; i < emptyCount; i += 1) {
        const x = i * step + barWidth / 2
        activeCtx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.7)'
        activeCtx.beginPath()
        activeCtx.arc(x, midY, 1.1 * dpr, 0, Math.PI * 2)
        activeCtx.fill()
      }

      for (let i = 0; i < history.length; i += 1) {
        const level = history[i] ?? 0
        const barHeight = Math.max(2.5 * dpr, level * (height * 0.88))
        const x = (emptyCount + i) * step
        const y = (height - barHeight) / 2
        // Newest bars pick up a touch of theme accent; older stay slate.
        const age = i / Math.max(1, history.length - 1)
        const useAccent = age > 0.72
        activeCtx.fillStyle = useAccent
          ? `rgba(${accentRgb}, ${0.55 + level * 0.4})`
          : `rgba(${barRgb}, ${0.55 + level * 0.4})`
        if (typeof activeCtx.roundRect === 'function') {
          activeCtx.beginPath()
          activeCtx.roundRect(x, y, barWidth, barHeight, barWidth / 2)
          activeCtx.fill()
        } else {
          activeCtx.fillRect(x, y, barWidth, barHeight)
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return true
  }, [cancelRaf])

  const startWaveform = useCallback(
    async (stream: MediaStream) => {
      stopWaveform()
      streamRef.current = stream
      pausedRef.current = false

      const AudioCtx =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const audioContext = new AudioCtx()
      audioContextRef.current = audioContext
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      if (streamRef.current !== stream) {
        void audioContext.close().catch(() => undefined)
        if (audioContextRef.current === audioContext) audioContextRef.current = null
        return
      }

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.2
      source.connect(analyser)
      sourceRef.current = source
      analyserRef.current = analyser

      let attempts = 0
      const tryStart = () => {
        if (streamRef.current !== stream) return
        if (drawWaveform()) return
        attempts += 1
        if (attempts < 60) {
          rafRef.current = requestAnimationFrame(tryStart)
        }
      }
      tryStart()
    },
    [drawWaveform, stopWaveform]
  )

  const attachCanvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node
      if (node && analyserRef.current && !drawingRef.current) {
        drawWaveform()
      }
    },
    [drawWaveform]
  )

  useEffect(() => () => stopWaveform(), [stopWaveform])

  return { canvasRef: attachCanvas, startWaveform, stopWaveform, setPaused }
}
