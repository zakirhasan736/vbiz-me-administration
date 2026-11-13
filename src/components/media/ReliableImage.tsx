'use client'

import { displayImageSrc } from '@/lib/media/displayImageSrc'
import { useState, type ImgHTMLAttributes } from 'react'

type ReliableImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
}

/**
 * Shows a pasted image URL. If the browser is blocked (hotlink or a host next/image
 * cannot optimize), retry through the same-origin image proxy.
 */
export function ReliableImage({ src, onError, alt = '', ...rest }: ReliableImageProps) {
  const preferred = displayImageSrc(src)
  const [trackedSrc, setTrackedSrc] = useState(src)
  const [current, setCurrent] = useState(preferred)
  const [usedFallback, setUsedFallback] = useState(false)

  if (trackedSrc !== src) {
    setTrackedSrc(src)
    setCurrent(displayImageSrc(src))
    setUsedFallback(false)
  }

  const shown = trackedSrc === src ? current : preferred
  const usingProxy = shown.startsWith('/api/remote-image')

  return (
    // eslint-disable-next-line @next/next/no-img-element -- pasted media can live on any host
    <img
      {...rest}
      src={shown}
      alt={alt}
      referrerPolicy={usingProxy ? undefined : 'no-referrer'}
      onError={(event) => {
        if (!usedFallback && shown !== src) {
          setUsedFallback(true)
          setCurrent(src)
          return
        }
        onError?.(event)
      }}
    />
  )
}
