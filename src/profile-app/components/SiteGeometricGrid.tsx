/** Background grid from profile template v1. */
export function SiteGeometricGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.05] select-none dark:opacity-[0.03]">
      <div className="absolute top-0 bottom-0 left-[10%] w-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-0 bottom-0 left-[30%] w-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-0 bottom-0 left-[50%] w-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-0 bottom-0 left-[70%] w-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-0 bottom-0 left-[90%] w-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-[20%] right-0 left-0 h-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-[40%] right-0 left-0 h-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-[60%] right-0 left-0 h-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-[80%] right-0 left-0 h-px bg-gray-50 dark:bg-white" />
      <div className="absolute top-[40%] left-[10%] h-24 w-24 border border-black/5 dark:border-white" />
      <div className="absolute top-[80%] left-[70%] h-32 w-32 border border-black/5 dark:border-white" />
      <div className="absolute top-[20%] left-[50%] h-16 w-16 rotate-45 border border-black/5 dark:border-white" />
      <div className="absolute top-[60%] left-[30%] h-20 w-20 border border-black/5 dark:border-white" />
    </div>
  )
}
