export type TimeLeft = {
  hours: number
  minutes: number
  seconds: number
}

export const DEFAULT_TIME_LEFT: TimeLeft = { hours: 23, minutes: 59, seconds: 59 }

const ORDER_STORAGE_KEY = 'customOrderPlaced'
const ORDER_DURATION_MS = 24 * 60 * 60 * 1000

export function getOrderTargetTime(): number | null {
  if (typeof window === 'undefined') return null
  const orderTimestamp = localStorage.getItem(ORDER_STORAGE_KEY)
  if (!orderTimestamp) return null
  return parseInt(orderTimestamp, 10) + ORDER_DURATION_MS
}

export function computeTimeLeft(targetTime: number): TimeLeft {
  const diff = targetTime - Date.now()
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 }
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

export function formatCountdownUnit(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatDeliveryCountdown(timeLeft: TimeLeft): string {
  return `${timeLeft.hours}h ${formatCountdownUnit(timeLeft.minutes)}m ${formatCountdownUnit(timeLeft.seconds)}s`
}
