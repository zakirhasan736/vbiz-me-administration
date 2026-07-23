const DEFAULT_SCOPES = [
  'asset:read',
  'asset:write',
  'design:meta:read',
  'design:content:read',
  'design:content:write',
  'folder:read',
  'folder:write',
  'profile:read',
]

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

export function getCanvaConfig() {
  const appUrl = optionalEnv('NEXT_PUBLIC_APP_URL', 'http://127.0.0.1:3000')
  const redirectUri = optionalEnv('CANVA_REDIRECT_URI', `${appUrl}/api/canva/callback`)

  return {
    clientId: requiredEnv('CANVA_CLIENT_ID'),
    clientSecret: requiredEnv('CANVA_CLIENT_SECRET'),
    redirectUri,
    scopes: optionalEnv('CANVA_SCOPES', DEFAULT_SCOPES.join(' ')),
    authBaseUrl: optionalEnv('CANVA_AUTH_BASE_URL', 'https://www.canva.com/api/oauth/authorize'),
    apiBaseUrl: optionalEnv('CANVA_API_BASE_URL', 'https://api.canva.com/rest/v1'),
    tokenEncryptionKey: requiredEnv('CANVA_TOKEN_ENCRYPTION_KEY'),
    appUrl,
  }
}

export function getCanvaPublicConfig() {
  return {
    redirectUri: optionalEnv(
      'CANVA_REDIRECT_URI',
      `${optionalEnv('NEXT_PUBLIC_APP_URL', 'http://127.0.0.1:3000')}/api/canva/callback`
    ),
    scopes: optionalEnv('CANVA_SCOPES', DEFAULT_SCOPES.join(' ')),
  }
}
