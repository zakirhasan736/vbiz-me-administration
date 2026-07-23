import { Suspense } from 'react'
import CreateVCardClient from '../CreateVCardClient'

type Props = {
  params: Promise<{ segments?: string[] }>
}

export default async function VCardCreateSectionPage({ params }: Props) {
  const { segments } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">Loading…</div>
      }
    >
      <CreateVCardClient segments={segments} />
    </Suspense>
  )
}
