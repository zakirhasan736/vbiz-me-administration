import { handleCanvaOAuthCallback } from '@/lib/canva/callback-handler'
import { redirect } from 'next/navigation'

type CanvaCallbackPageProps = {
  searchParams: Promise<{
    code?: string
    state?: string
    error?: string
    error_description?: string
  }>
}

export default async function CanvaCallbackPage({ searchParams }: CanvaCallbackPageProps) {
  const params = await searchParams
  const resultUrl = await handleCanvaOAuthCallback(params)
  redirect(resultUrl)
}
