'use client'

import { useState } from 'react'

export function useLastGoodData<T>(data: T | undefined): T | undefined {
  const [lastGood, setLastGood] = useState(data)
  const [prevData, setPrevData] = useState(data)

  if (data !== prevData) {
    setPrevData(data)
    if (data !== undefined) {
      setLastGood(data)
    }
  }

  return data !== undefined ? data : lastGood
}

export default useLastGoodData
