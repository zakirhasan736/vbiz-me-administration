export interface IApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export type ApiResponse<T> = IApiResponse<T>
