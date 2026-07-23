import PublicProfileLayout from '@/views/PublicProfileLayout'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

/** Stable per-slug layout — cover + header + nav persist across section routes. */
export default async function PublicVCardSlugLayout({ children, params }: Props) {
  const { slug } = await params
  const trimmed = slug?.trim()

  if (!trimmed) {
    notFound()
  }

  return <PublicProfileLayout slug={trimmed}>{children}</PublicProfileLayout>
}
