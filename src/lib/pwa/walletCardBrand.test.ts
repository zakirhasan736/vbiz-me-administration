import { WALLET_ART_SIZE, parseWalletArtFormat } from '@/lib/pwa/walletCardBrand'
import { describe, expect, it } from 'vitest'

describe('wallet pass art sizes', () => {
  it('renders Google hero at 3x native 1032×336 so the pass is not upscaled', () => {
    expect(WALLET_ART_SIZE.hero).toEqual({ width: 3096, height: 1008 })
  })

  it('renders Apple strip densities at native 1x/2x/3x', () => {
    expect(WALLET_ART_SIZE.strip1x).toEqual({ width: 375, height: 144 })
    expect(WALLET_ART_SIZE.strip2x).toEqual({ width: 750, height: 288 })
    expect(WALLET_ART_SIZE.strip).toEqual({ width: 1125, height: 432 })
  })

  it('keeps the popup card face at credit-card ratio', () => {
    const { width, height } = WALLET_ART_SIZE.card
    expect(width / height).toBeCloseTo(1.586, 2)
  })

  it('parses wallet art format query values', () => {
    expect(parseWalletArtFormat('hero')).toBe('hero')
    expect(parseWalletArtFormat('logo')).toBe('logo')
    expect(parseWalletArtFormat('strip2x')).toBe('strip2x')
    expect(parseWalletArtFormat('unknown')).toBe('card')
  })
})
