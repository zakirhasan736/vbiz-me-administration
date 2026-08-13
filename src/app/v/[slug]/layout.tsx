import type { Viewport } from 'next'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Safe-area + theme for installed PWA (v1/v2/v3 public card). */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0f19',
}

/** Pass-through — SSR page owns `PublicProfileLayout`. */
export default function PublicVCardSlugLayout({ children }: Props) {
  return children
}
