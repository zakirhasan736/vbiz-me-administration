'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const useSetSearchParams = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateSearchParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()))

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          currentParams.set(key, value)
        } else {
          currentParams.delete(key)
        }
      })

      const search = currentParams.toString()
      const query = search ? `?${search}` : ''
      const url = `${pathname}${query}`

      router.replace(url)
    },
    [searchParams, router, pathname]
  )

  const clearSearchParams = () => {
    router.replace(pathname)
  }

  return { searchParams, updateSearchParams, clearSearchParams }
}

export default useSetSearchParams
