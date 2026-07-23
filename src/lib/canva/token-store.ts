import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

import { refreshAccessToken } from '@/lib/canva/client'
import { getCanvaConfig } from '@/lib/canva/config'
import type { CanvaConnectionStatus, CanvaTokenResponse, StoredCanvaTokens } from '@/lib/canva/types'

const TOKEN_STORE_PATH = path.join(process.cwd(), 'data', 'canva-tokens.json')

type EncryptedTokenRecord = {
  payload: string
  iv: string
  tag: string
}

type TokenStoreFile = Record<string, EncryptedTokenRecord>

function getEncryptionKey() {
  const { tokenEncryptionKey } = getCanvaConfig()
  return createHash('sha256').update(tokenEncryptionKey).digest()
}

function encryptTokens(tokens: StoredCanvaTokens): EncryptedTokenRecord {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    payload: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

function decryptTokens(record: EncryptedTokenRecord): StoredCanvaTokens {
  const key = getEncryptionKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(record.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(record.tag, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(record.payload, 'base64')), decipher.final()])

  return JSON.parse(decrypted.toString('utf8')) as StoredCanvaTokens
}

async function readStore(): Promise<TokenStoreFile> {
  try {
    const raw = await readFile(TOKEN_STORE_PATH, 'utf8')
    return JSON.parse(raw) as TokenStoreFile
  } catch {
    return {}
  }
}

async function writeStore(store: TokenStoreFile) {
  await mkdir(path.dirname(TOKEN_STORE_PATH), { recursive: true })
  await writeFile(TOKEN_STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function toStoredTokens(tokenResponse: CanvaTokenResponse): StoredCanvaTokens {
  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    scope: tokenResponse.scope,
    connectedAt: Date.now(),
  }
}

export async function saveCanvaTokens(userId: string, tokenResponse: CanvaTokenResponse) {
  const store = await readStore()
  store[userId] = encryptTokens(toStoredTokens(tokenResponse))
  await writeStore(store)
}

export async function getCanvaTokens(userId: string): Promise<StoredCanvaTokens | null> {
  const store = await readStore()
  const record = store[userId]
  if (!record) return null

  try {
    return decryptTokens(record)
  } catch {
    delete store[userId]
    await writeStore(store)
    return null
  }
}

export async function deleteCanvaTokens(userId: string) {
  const store = await readStore()
  if (!store[userId]) return
  delete store[userId]
  await writeStore(store)
}

export async function getCanvaConnectionStatus(userId: string): Promise<CanvaConnectionStatus> {
  const tokens = await getCanvaTokens(userId)
  if (!tokens) {
    return { connected: false }
  }

  return {
    connected: true,
    scope: tokens.scope,
    connectedAt: tokens.connectedAt,
    expiresAt: tokens.expiresAt,
  }
}

export async function getValidCanvaAccessToken(userId: string): Promise<string | null> {
  const tokens = await getCanvaTokens(userId)
  if (!tokens) return null

  const refreshBufferMs = 60_000
  if (Date.now() < tokens.expiresAt - refreshBufferMs) {
    return tokens.accessToken
  }

  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    await saveCanvaTokens(userId, refreshed)
    return refreshed.access_token
  } catch {
    await deleteCanvaTokens(userId)
    return null
  }
}
