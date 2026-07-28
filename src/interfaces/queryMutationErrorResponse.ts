export interface IQueryMutationErrorResponse {
  data: {
    message: string
    errorMessages: { path: string; message: string }[]
    statusCode: number
    success: boolean
    code?: string
    data?: {
      email?: string
      providers?: string[]
      passwordSetupToken?: string
      hasPassword?: boolean
      cooldownEnd?: number
      remainingSecond?: number
      expiresAt?: number
      [key: string]: unknown
    }
  }
  status?: number
}

export type TSearchParams = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}
