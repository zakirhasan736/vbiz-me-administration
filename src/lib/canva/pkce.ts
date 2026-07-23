import { createHash, randomBytes } from 'crypto'

export function createPkcePair() {
  const codeVerifier = randomBytes(96).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeVerifier, codeChallenge }
}

export function createOAuthState() {
  return randomBytes(96).toString('base64url')
}
