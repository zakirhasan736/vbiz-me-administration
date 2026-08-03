'use client'

/** Themed loading state while profile data is fetched. Uses API theme vars when available. */
export function ProfileLoadingScreen({ label = 'Loading profile…' }: { label?: string }) {
  return (
    <div className="vbiz-loading-screen flex min-h-screen flex-col items-center justify-center gap-4">
      <div
        className="vbiz-loading-spinner h-10 w-10 animate-spin rounded-full border-4"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
