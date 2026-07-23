'use client'

import { computeTimeLeft, DEFAULT_TIME_LEFT, getOrderTargetTime, type TimeLeft } from '@/utils/orderTimer'
import { useEffect, useState } from 'react'

export function useOrderTimer() {
  const [hasOrder] = useState(() => getOrderTargetTime() !== null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    const targetTime = getOrderTargetTime()
    return targetTime ? computeTimeLeft(targetTime) : DEFAULT_TIME_LEFT
  })

  useEffect(() => {
    const targetTime = getOrderTargetTime()
    if (!targetTime) return

    const updateTimer = () => {
      setTimeLeft(computeTimeLeft(targetTime))
    }

    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  return { hasOrder, timeLeft }
}
