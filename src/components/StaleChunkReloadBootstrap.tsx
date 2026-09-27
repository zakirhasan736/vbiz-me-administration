import { STALE_CHUNK_RELOAD_BOOTSTRAP } from '@/lib/staleChunkReload'
import Script from 'next/script'

/** Recover from stale Next chunks before React hydrates (Chrome "Uncaught ChunkLoadError"). */
export function StaleChunkReloadBootstrap() {
  return (
    <Script
      id="vbiz-stale-chunk-reload"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: STALE_CHUNK_RELOAD_BOOTSTRAP,
      }}
    />
  )
}
