'use client'

import { formatRecordingElapsed } from '@/lib/media/mediaRecorderMime'
import { cn } from '@/utils/cn'
import { Loader2, Pause, Play, Square, Trash2 } from 'lucide-react'
import type { Ref } from 'react'
import type { MicWaveAccent } from './useLiveMicWaveform'

const ACCENT_STYLES: Record<
  MicWaveAccent,
  {
    shell: string
    dot: string
    pause: string
    pauseHover: string
    stop: string
    discardHover: string
    nearLimit: string
  }
> = {
  rose: {
    shell: 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1018]',
    dot: 'bg-rose-500',
    pause: 'text-rose-600 dark:text-rose-300',
    pauseHover: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
    stop: 'bg-slate-950 text-white dark:bg-rose-500',
    discardHover: 'hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-white/10 dark:hover:text-rose-300',
    nearLimit: 'text-rose-600 dark:text-rose-300',
  },
  indigo: {
    shell: 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1018]',
    dot: 'bg-indigo-500',
    pause: 'text-indigo-600 dark:text-indigo-300',
    pauseHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    stop: 'bg-slate-950 text-white dark:bg-indigo-500',
    discardHover: 'hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-white/10 dark:hover:text-indigo-300',
    nearLimit: 'text-indigo-600 dark:text-indigo-300',
  },
}

export type CrmRecordingActiveBarProps = {
  accent?: MicWaveAccent
  elapsed: number
  maxSeconds?: number | null
  nearLimit?: boolean
  busy?: boolean
  paused?: boolean
  canvasRef: Ref<HTMLCanvasElement>
  onStop: () => void
  onDiscard?: () => void
  onPauseToggle?: () => void
  stopLabel?: string
  className?: string
}

export function CrmRecordingActiveBar({
  accent = 'rose',
  elapsed,
  maxSeconds = null,
  nearLimit = false,
  busy = false,
  paused = false,
  canvasRef,
  onStop,
  onDiscard,
  onPauseToggle,
  stopLabel = 'Stop',
  className,
}: CrmRecordingActiveBarProps) {
  const styles = ACCENT_STYLES[accent]

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border px-2.5 py-2.5 sm:gap-3 sm:px-3',
        styles.shell,
        className
      )}
    >
      {onDiscard ? (
        <button
          type="button"
          disabled={busy}
          onClick={onDiscard}
          className={cn('shrink-0 rounded-xl p-2 text-slate-500 transition disabled:opacity-50', styles.discardHover)}
          aria-label="Discard recording"
          title="Discard"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-2 shrink-0" aria-hidden />
      )}

      <div className="flex shrink-0 items-center gap-2">
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          {!paused ? (
            <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', styles.dot)} aria-hidden />
          ) : null}
          <span className={cn('relative h-2 w-2 rounded-full', styles.dot, paused && 'opacity-50')} />
        </span>
        <p
          className={cn(
            'min-w-11 font-mono text-xs font-semibold text-slate-600 tabular-nums dark:text-slate-300',
            nearLimit && styles.nearLimit,
            paused && 'opacity-70'
          )}
        >
          {formatRecordingElapsed(elapsed)}
          {maxSeconds != null ? (
            <span className="hidden text-slate-400 sm:inline"> / {formatRecordingElapsed(maxSeconds)}</span>
          ) : null}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <canvas ref={canvasRef} width={320} height={36} className="block h-8 w-full sm:h-9" aria-hidden />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onPauseToggle ? (
          <button
            type="button"
            disabled={busy}
            onClick={onPauseToggle}
            className={cn('rounded-xl p-2 transition disabled:opacity-50', styles.pause, styles.pauseHover)}
            aria-label={paused ? 'Resume recording' : 'Pause recording'}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
          </button>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={onStop}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition disabled:opacity-50',
            styles.stop
          )}
          aria-label={stopLabel}
          title={stopLabel}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3 w-3 fill-current" />}
        </button>
      </div>
    </div>
  )
}
