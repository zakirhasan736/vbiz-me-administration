/** First-paint placeholder for the editor shell — only shown on a hard page load. */
export function EditorBootSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen w-full justify-center pt-4 pb-24 sm:pt-10">
      <div className="flex w-full max-w-325 flex-col gap-6">
        <div className="h-11 w-52 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5" />
        <div className="h-14 w-full animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/5" />
        <div className="min-h-175 w-full animate-pulse rounded-3xl bg-slate-200/50 dark:bg-white/5" />
        {message ? (
          <p className="text-center text-sm font-medium text-slate-500" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
