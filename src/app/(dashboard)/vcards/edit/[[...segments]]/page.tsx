import { Suspense } from 'react'
import EditVCardClient from '../EditVCardClient'

type Props = {
  params: Promise<{ segments?: string[] }>
}

export default async function VCardEditSectionPage({ params }: Props) {
  const { segments } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
          Loading editor…
        </div>
      }
    >
      <EditVCardClient segments={segments} />
    </Suspense>
  )
}
