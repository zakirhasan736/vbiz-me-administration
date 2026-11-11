import { FeaturedCardMedia } from '@/profile-app/components/FeaturedCardMedia'
import { PositionedFeatureMedia } from '@/profile-app/components/PositionedFeatureMedia'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

const mounted: Array<{ root: Root; host: HTMLElement }> = []

function render(node: ReactNode): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(node))
  mounted.push({ root, host })
  return host
}

afterEach(() => {
  for (const { root, host } of mounted.splice(0)) {
    act(() => root.unmount())
    host.remove()
  }
})

describe('pasted feature media URLs on the public card', () => {
  it('plays a pasted YouTube link in an embedded player', () => {
    const host = render(<FeaturedCardMedia src="https://youtu.be/GghZCyc_fnU" alt="Intro" />)
    expect(host.querySelector('iframe')?.getAttribute('src')).toBe('https://www.youtube.com/embed/GghZCyc_fnU')
    expect(host.querySelector('video')).toBeNull()
  })

  it('plays a pasted Vimeo link in an embedded player', () => {
    const host = render(<PositionedFeatureMedia src="https://vimeo.com/76979871" alt="Intro" className="w-full" />)
    expect(host.querySelector('iframe')?.getAttribute('src')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('plays a pasted .mp4 even when the section does not pass video', () => {
    const host = render(<FeaturedCardMedia src="https://cdn.example.com/intro.mp4" alt="Intro" />)
    expect(host.querySelector('video')?.getAttribute('src')).toBe('https://cdn.example.com/intro.mp4')
    expect(host.querySelector('img')).toBeNull()
  })

  it('shows a pasted image link, including extensionless CDN images', () => {
    const src = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=1200'
    const host = render(<FeaturedCardMedia src={src} alt="Team photo" />)
    expect(host.querySelector('img')?.getAttribute('src')).toBe(src)
  })
})
